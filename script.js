// Ensure Supabase is initialized before any usage
const supabaseUrl = "https://mfpgbqamqsdjmjlcbkqc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcGdicWFtcXNkam1qbGNia3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMDQ3MjAsImV4cCI6MjA1Nzc4MDcyMH0.zKQ30--UBBwLlOHiNgmExOLmdtzq_U8avgYJoHtiZUk";
const supabase = window.supabase?.createClient(supabaseUrl, supabaseKey) || supabase.createClient(supabaseUrl, supabaseKey);

console.log("✅ Supabase Initialized:", supabase); // Debugging

function slugify(text) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function saveCapsule() {
    const capsuleName = document.getElementById("capsule-name").value.trim();
    const unlockDate = document.getElementById("unlock-date").value;
    const message = document.getElementById("message").value;
    const linkInput = document.getElementById("capsule-link").value.trim();

    if (!capsuleName || !unlockDate || !message) {
        alert("Please provide a capsule name, set an unlock date, and write a message.");
        return;
    }

    // Convert local time to UTC before saving
    const unlockDateUTC = new Date(unlockDate).toISOString();

    const { data, error } = await supabase
        .from("capsules")
        .insert([{
            name: capsuleName,
            unlock_date: unlockDateUTC, // 👈 Save as UTC
            message,
            file_data: null,
            file_type: null,
            link: linkInput,
            created_at: new Date().toISOString() // Ensure created_at is also UTC
        }]);

    if (error) {
        console.error("Error saving capsule:", error.message);
    } else {
        console.log("Capsule saved:", data);
        loadCapsuleHistory();
    }
}


async function loadCapsuleHistory() {
    const historyContainer = document.getElementById("capsule-history");
    historyContainer.innerHTML = "";

    const { data, error } = await supabase.from("capsules").select("id, name, unlock_date");
    if (error || !data.length) {
        historyContainer.innerHTML = "<p>No capsules created yet.</p>";
        return;
    }

    data.forEach(({ id, name, unlock_date }) => {
        const unlockDateFormatted = new Date(unlock_date).toLocaleString();
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <strong>${name}</strong> (Unlocks: ${unlockDateFormatted})
            <a href="capsule.html?capsule=${encodeURIComponent(id)}" target="_blank">Open</a>
            <button onclick="editCapsule('${id}')">Edit</button>
            <button onclick="deleteCapsule('${id}')">Delete</button>
        `;
        historyContainer.appendChild(listItem);
    });
}

async function editCapsule(capsuleId) {
    // Fetch capsule data from Supabase instead of localStorage
    const { data, error } = await supabase
        .from("capsules")
        .select("*")
        .eq("id", capsuleId)
        .single(); // Get only one result

    if (error || !data) {
        alert("Capsule not found.");
        return;
    }

    // Extract capsule details
    const { name, unlock_date, message, link, file_data } = data;
    
    // Populate the form with capsule details
    document.getElementById("editing-capsule-id").value = capsuleId;
    document.getElementById("capsule-name").value = name;

    // Convert UTC time from Supabase to local time for input field
    const localDate = new Date(unlock_date);
    const localDateTimeString = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16); // Format for <input type="datetime-local">
    document.getElementById("unlock-date").value = localDateTimeString;

    document.getElementById("message").value = message;
    document.getElementById("capsule-link").value = link;

    if (file_data) {
        document.getElementById("file-upload").setAttribute("data-file-name", "File previously uploaded");
    }

    document.getElementById("cancel-edit-btn").classList.remove("hidden");
}


async function deleteCapsule(capsuleId) {
    const { error } = await supabase
        .from("capsules")
        .delete()
        .eq("id", capsuleId);

    if (error) {
        console.error("Error deleting capsule:", error.message);
        return;
    }

    console.log("Capsule deleted successfully");
    loadCapsuleHistory();
}

function cancelEdit() {
    document.getElementById("capsule-name").value = "";
    document.getElementById("unlock-date").value = "";
    document.getElementById("message").value = "";
    document.getElementById("capsule-link").value = "";
    document.getElementById("editing-capsule-id").value = "";
    document.getElementById("cancel-edit-btn").classList.add("hidden");
}

// Ensure functions are available after page load
document.addEventListener("DOMContentLoaded", () => {
    loadCapsuleHistory();
});
