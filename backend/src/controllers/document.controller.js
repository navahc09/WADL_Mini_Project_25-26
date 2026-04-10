const { query, withTransaction } = require("../db");
const { uploadFile, generateSignedUrl } = require("../services/s3.service");
const { mapDocumentRow } = require("../services/presentation.service");

function inferDocType(file, docType) {
  if (docType) {
    return String(docType).toLowerCase().replace(/\s+/g, "_");
  }

  const name = file.originalname.toLowerCase();
  if (name.includes("resume") || name.includes("cv")) return "resume";
  if (name.includes("mark")) return "marksheet";
  if (name.includes("cert")) return "certificate";
  return file.mimetype.startsWith("image/") ? "image" : "document";
}

async function loadStudentProfileId(userId) {
  const { rows } = await query("SELECT id FROM student_profiles WHERE user_id = $1", [userId]);
  return rows[0]?.id || null;
}

async function listDocuments(req, res, next) {
  try {
    const studentId = await loadStudentProfileId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const { rows } = await query(
      `
        SELECT *
        FROM documents
        WHERE student_id = $1
        ORDER BY uploaded_at DESC
      `,
      [studentId],
    );

    res.json(rows.map(mapDocumentRow));
  } catch (error) {
    next(error);
  }
}

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Document file is required" });
    }

    const studentId = await loadStudentProfileId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const docType = inferDocType(req.file, req.body.docType);
    const isPrimary = String(req.body.primary).toLowerCase() === "true" || docType === "resume";
    const folder = docType === "resume" ? "resumes" : "documents";
    const s3Key = await uploadFile(req.file.buffer, req.file.mimetype, folder, req.file.originalname);

    const document = await withTransaction(async (client) => {
      if (isPrimary) {
        await client.query(
          `
            UPDATE documents
            SET is_primary = FALSE
            WHERE student_id = $1
              AND doc_type = 'resume'
          `,
          [studentId],
        );
      }

      const insertResult = await client.query(
        `
          INSERT INTO documents (
            student_id,
            doc_type,
            file_name,
            s3_key,
            file_size_bytes,
            mime_type,
            is_primary
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `,
        [
          studentId,
          docType,
          req.file.originalname,
          s3Key,
          req.file.size,
          req.file.mimetype,
          isPrimary,
        ],
      );

      if (docType === "resume" && isPrimary) {
        await client.query(
          `
            UPDATE student_profiles
            SET resume_s3_key = $1, resume_url = $2
            WHERE id = $3
          `,
          [s3Key, `s3://${process.env.S3_BUCKET_NAME}/${s3Key}`, studentId],
        );
      }

      return insertResult.rows[0];
    });

    res.status(201).json(mapDocumentRow(document));
  } catch (error) {
    next(error);
  }
}

async function accessDocument(req, res, next) {
  try {
    const { rows } = await query(
      `
        SELECT
          d.*,
          sp.user_id
        FROM documents d
        JOIN student_profiles sp ON sp.id = d.student_id
        WHERE d.id = $1
      `,
      [req.params.id],
    );

    const document = rows[0];
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (req.user.role === "student" && document.user_id !== req.user.id) {
      return res.status(403).json({ error: "You do not have access to this document" });
    }

    const action = req.query.action || "view";
    const signedUrl = await generateSignedUrl(document.s3_key, 3600);

    await query(
      `
        INSERT INTO document_access_logs (document_id, accessed_by, action, ip_address)
        VALUES ($1, $2, $3, $4)
      `,
      [document.id, req.user.id, action, req.ip],
    );

    res.json({
      url: signedUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listDocuments,
  uploadDocument,
  accessDocument,
};
