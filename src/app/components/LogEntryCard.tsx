import React, { useState } from 'react';
import { MoreHorizontal, Plus, Trash2, ArrowRight, Check } from 'lucide-react';
import { TagChip } from './TagChip';
import { IntensityDots } from './IntensityDots';
import type { LogEntry } from '../context/AppContext';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

export function LogEntryCard({ entry }: { entry: LogEntry }) {
  const { toggleEntryPrep, deleteEntry } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = format(entry.timestamp, "EEEE, h:mmaaa");

  const handleDelete = () => {
    deleteEntry(entry.id);
    setConfirmDelete(false);
    toast('Entry deleted.', { duration: 2000 });
  };

  return (
    <>
      <div className="group relative bg-card border border-border rounded-lg p-4 transition-all duration-200 hover:border-muted-foreground/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[12px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formattedDate}
              </span>
              <TagChip type={entry.type} />
            </div>
            <p className="text-foreground text-[15px] leading-relaxed">{entry.text}</p>
            <div className="flex items-center gap-3 mt-3">
              <IntensityDots value={entry.intensity} max={5} />
              {entry.addedToPrep && (
                <span className="text-[11px] text-sage flex items-center gap-1">
                  <Check className="w-3 h-3" /> In session prep
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-150">
            {!entry.addedToPrep && (
              <button
                onClick={() => {
                  toggleEntryPrep(entry.id);
                  toast('Added to session prep.', { duration: 2000 });
                }}
                className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                title="Add to session prep"
                aria-label="Add to session prep"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                aria-label="More actions"
                aria-expanded={menuOpen}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                    <button
                      onClick={() => { toggleEntryPrep(entry.id); setMenuOpen(false); toast(entry.addedToPrep ? 'Removed from prep.' : 'Added to prep.', { duration: 2000 }); }}
                      className="w-full text-left px-3 py-2 text-[14px] hover:bg-secondary flex items-center gap-2 text-foreground"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> {entry.addedToPrep ? 'Remove from prep' : 'Add to prep'}
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                      className="w-full text-left px-3 py-2 text-[14px] hover:bg-secondary flex items-center gap-2 text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete this entry?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This can't be undone. The entry will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 border border-border rounded-lg text-[14px] text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-destructive text-white rounded-lg text-[14px] hover:bg-destructive/90 transition-colors"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}