const supabaseUrl = "https://mfpgbqamqsdjmjlcbkqc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcGdicWFtcXNkam1qbGNia3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMDQ3MjAsImV4cCI6MjA1Nzc4MDcyMH0.zKQ30--UBBwLlOHiNgmExOLmdtzq_U8avgYJoHtiZUk";
// Ensure Supabase is initialized properly
const supabase = window.supabase?.createClient(supabaseUrl, supabaseKey) || supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase initialized:", supabase); // Debugging check

async function checkCapsuleAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const capsuleId = urlParams.get("capsule");

    if (!capsuleId) {
        document.body.innerHTML = "<h2>Capsule not found</h2>";
        return;
    }

    // Fetch capsule from Supabase
    const { data, error } = await supabase
        .from("capsules")
        .select("unlock_date, message, file_data, file_type, link")
        .eq("id", capsuleId)
        .single();

    if (error || !data) {
        document.body.innerHTML = "<h2>Capsule not found</h2>";
        return;
    }

    const { unlock_date, message, file_data, file_type, link } = data;
    const unlockDate = new Date(unlock_date).getTime(); // Ensure it's a valid timestamp
    const countdownElement = document.getElementById("countdown");

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const timeLeft = unlockDate - now;

        if (timeLeft <= 0) {
            clearInterval(interval);
            countdownElement.innerHTML = "🎉 Time Capsule Unlocked! 🎉";
            showCapsuleContent(message, file_data, file_type, link);
        } else {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            countdownElement.innerHTML = `Unlocks in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
    }, 1000);
}

function showCapsuleContent(message, fileData, fileType, link) {
    document.getElementById("saved-message").innerText = message;
    const mediaContainer = document.getElementById("saved-media");
    mediaContainer.innerHTML = "";

    if (fileData && fileType) {
        if (fileType.startsWith("image/")) {
            mediaContainer.innerHTML = `<img src="${fileData}" alt="Capsule Image">`;
        } else if (fileType.startsWith("video/")) {
            mediaContainer.innerHTML = `<video controls><source src="${fileData}" type="${fileType}">Your browser does not support the video tag.</video>`;
        }
    }

    if (link) {
        const linkElement = document.createElement("a");
        linkElement.href = link;
        linkElement.target = "_blank";
        linkElement.innerText = "Touch here for the next surprise 🪄🔮";
        mediaContainer.appendChild(linkElement);
    }

    document.getElementById("capsule-content").classList.remove("hidden");
}

// Run check on page load
checkCapsuleAccess();
