import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function AddPaper() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [journals, setJournals] = useState([]); // List from API
  const [selectedJournal, setSelectedJournal] = useState("");
  const [authors, setAuthors] = useState([]); // Array of { name, isCorresponding }
  const [currentAuthor, setCurrentAuthor] = useState("");
  const [msg, setMsg] = useState("");

  // Load journals to populate the selection box
  useEffect(() => {
    fetch("/api/journals").then(res => res.json()).then(data => setJournals(data));
  }, []);

  const addAuthor = () => {
    if (!currentAuthor.trim()) return;
    setAuthors([...authors, { name: currentAuthor.trim(), isCorresponding: authors.length === 0 }]);
    setCurrentAuthor("");
  };

  const toggleCorresponding = (index) => {
    const updated = authors.map((a, i) => ({
      ...a,
      isCorresponding: i === index
    }));
    setAuthors(updated);
  };

  async function handleCreatePaper(e) {
    e.preventDefault();
    setMsg("");

    // Frontend Validation
    if (!title.trim() || !selectedJournal) {
      setMsg("❌ Missing title or journal selection");
      return;
    }

    const journalData = journals.find(j => j._id === selectedJournal);

    const payload = {
      title: title.trim(),
      url: "", // Requirement 3: Blank by default
      authors: authors,
      initialJournalId: selectedJournal,
      initialJournalTitle: journalData?.title || "Unknown Journal"
    };

    const res = await fetch("/api/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/papers"); // Requirement 2: Redirect to papers list
    } else {
      const data = await res.json();
      setMsg(`❌ Error: ${data.message}`);
    }
  }

  return (
    <main className="p-8 max-w-2xl mx-auto bg-white rounded-3xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6">Add New Paper</h1>
      <form onSubmit={handleCreatePaper} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Paper Title</label>
          <input 
            className="w-full p-3 border rounded-xl" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Enter paper title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Select Initial Journal</label>
          <select 
            className="w-full p-3 border rounded-xl"
            value={selectedJournal}
            onChange={(e) => setSelectedJournal(e.target.value)}
          >
            <option value="">-- Select a Journal --</option>
            {journals.map(j => (
              <option key={j._id} value={j._id}>{j.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Authors</label>
          <div className="flex gap-2">
            <input 
              className="flex-1 p-3 border rounded-xl" 
              value={currentAuthor} 
              onChange={(e) => setCurrentAuthor(e.target.value)} 
              placeholder="Author name"
            />
            <button type="button" onClick={addAuthor} className="bg-slate-800 text-white px-4 rounded-xl">Add</button>
          </div>
          <div className="mt-2 space-y-1">
            {authors.map((a, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-sm">
                <span>{a.name} {a.isCorresponding && <b className="text-blue-600">(Corresponding)</b>}</span>
                <button 
                  type="button" 
                  onClick={() => toggleCorresponding(i)}
                  className="text-xs text-blue-500 underline"
                >
                  Set as Corresponding
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg">
          Create Paper
        </button>

        {msg && <p className={`text-center font-medium ${msg.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      </form>
    </main>
  );
}