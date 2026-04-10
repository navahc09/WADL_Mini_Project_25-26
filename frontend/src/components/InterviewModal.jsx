import { Calendar, CheckCircle2, Clock, Loader2, Plus, X, XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Button from "./ui/Button";
import SurfaceCard from "./ui/SurfaceCard";
import { useInterviewRounds, useScheduleRound, useUpdateRoundResult } from "../hooks/useInterviews";

const ROUND_TYPE_OPTIONS = [
  { value: "aptitude", label: "Aptitude Test" },
  { value: "technical", label: "Technical Interview" },
  { value: "hr", label: "HR Interview" },
  { value: "group_discussion", label: "Group Discussion" },
  { value: "final", label: "Final Round" },
];

function ResultBadge({ result }) {
  if (result === "pass") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Pass
      </span>
    );
  }
  if (result === "fail") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
        <XCircle className="h-3 w-3" /> Fail
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

export default function InterviewModal({ appId, applicantName, onClose }) {
  const [showForm, setShowForm] = useState(false);
  const { data: rounds = [], isLoading } = useInterviewRounds(appId);
  const { mutateAsync: scheduleRound, isPending: isScheduling } = useScheduleRound(appId);
  const { mutateAsync: updateResult, isPending: isUpdating } = useUpdateRoundResult(appId);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { roundType: "technical", scheduledAt: "", venue: "", notes: "" },
  });

  const onSchedule = handleSubmit(async (values) => {
    try {
      await scheduleRound({
        roundType: values.roundType,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        venue: values.venue || undefined,
        notes: values.notes || undefined,
      });
      toast.success("Interview round scheduled. Student has been notified.");
      reset();
      setShowForm(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not schedule round.");
    }
  });

  const handleResult = async (roundId, result) => {
    try {
      await updateResult({ roundId, result });
      toast.success(`Round marked as ${result}.`);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not update result.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <SurfaceCard className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-container-low bg-surface-container-lowest px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-outline">Interview Pipeline</p>
            <h2 className="font-headline text-xl font-bold">{applicantName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Existing Rounds */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading interview rounds...
            </div>
          ) : rounds.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
              No interview rounds scheduled yet.
            </div>
          ) : (
            <div className="space-y-3">
              {rounds.map((round, index) => (
                <div
                  key={round.id}
                  className="rounded-2xl border border-surface-container-low bg-surface-container-lowest p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">{round.roundTypeLabel}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-on-surface-variant">
                          <Calendar className="h-3 w-3" />
                          {round.scheduledAtLabel}
                        </div>
                        {round.venue && (
                          <p className="mt-1 text-xs text-on-surface-variant">📍 {round.venue}</p>
                        )}
                        {round.notes && (
                          <p className="mt-1 text-xs italic text-on-surface-variant">{round.notes}</p>
                        )}
                      </div>
                    </div>
                    <ResultBadge result={round.result} />
                  </div>

                  {round.result === "pending" && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isUpdating}
                        onClick={() => handleResult(round.id, "pass")}
                      >
                        Mark Pass
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        disabled={isUpdating}
                        onClick={() => handleResult(round.id, "fail")}
                      >
                        Mark Fail
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Schedule New Round */}
          {!showForm ? (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4" /> Schedule New Round
            </Button>
          ) : (
            <form onSubmit={onSchedule} className="space-y-4 rounded-2xl border border-primary/20 bg-surface-container-low p-5">
              <h3 className="font-semibold text-on-surface">Schedule New Round</h3>
              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Round Type</span>
                <select className="field-shell w-full" {...register("roundType")}>
                  {ROUND_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Date & Time</span>
                <input
                  type="datetime-local"
                  className="field-shell w-full"
                  {...register("scheduledAt", { required: true })}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Venue (optional)</span>
                <input className="field-shell w-full" placeholder="Lab 3, CS Dept." {...register("venue")} />
              </label>
              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Notes (optional)</span>
                <textarea className="field-shell min-h-20 w-full resize-none" {...register("notes")} />
              </label>
              <div className="flex gap-3">
                <Button type="submit" disabled={isScheduling}>
                  {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isScheduling ? "Scheduling..." : "Confirm Schedule"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
