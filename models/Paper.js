import mongoose from "mongoose";

const PaperSchema = new mongoose.Schema({
  title: { type: String, required: true },
  
  // Requirement 3: URL should be blank by default
  url: { type: String, default: "" }, 
  
  // Requirement 3: Authors list with Corresponding flag
  authors: [{
    name: { type: String, required: true },
    isCorresponding: { type: Boolean, default: false } 
  }],

  // Requirement 3: The Journal Cycle History
  // Tracks each journal submission step one after another
  journalHistory: [{
    journalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Journal' },
    journalTitle: { type: String },
    status: { 
      type: String, 
      enum: ['submitted', 'under_review', 'revision_submitted', 'rejected', 'accepted'],
      default: 'submitted'
    },
    date_submitted: { type: Date, default: Date.now },
    last_updated: { type: Date, default: Date.now }
  }],

  // Requirement 3: Soft Delete implementation
  // Instead of deleting from DB, we flip this to true
  is_deleted: { type: Boolean, default: false }, 

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true,
  // This allows virtuals (like currentStatus) to be included in JSON results
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Requirement 3: Status Logic
 * The status of each paper in the list is the last status 
 * of the last journal in the journalHistory array.
 */
PaperSchema.virtual('currentStatus').get(function() {
  if (!this.journalHistory || this.journalHistory.length === 0) {
    return 'No Submissions';
  }
  const lastEntry = this.journalHistory[this.journalHistory.length - 1];
  return lastEntry.status;
});

export default mongoose.models.Paper || mongoose.model("Paper", PaperSchema);