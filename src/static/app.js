document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build a participants section if there are any
        let participantsHTML = "";
        if (details.participants && details.participants.length > 0) {
          participantsHTML = `
            <p><strong>Participants:</strong></p>
            <ul class="participants-list">
              ${details.participants
                .map(
                  (p) => `<li>${p} <span class="remove" data-activity="${name}" data-email="${p}">✖</span></li>`
                )
                .join("")}
            </ul>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        // attach listeners to remove buttons
        activityCard.querySelectorAll(".remove").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const activity = btn.dataset.activity;
            const email = btn.dataset.email;
            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(
                  email
                )}`,
                { method: "DELETE" }
              );
              const result = await res.json();
              messageDiv.textContent = res.ok
                ? result.message
                : result.detail || "An error occurred";
              messageDiv.className = res.ok ? "success" : "error";
              messageDiv.classList.remove("hidden");
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
              if (res.ok) {
                fetchActivities(); // refresh list/dropdown
              }
            } catch (err) {
              messageDiv.textContent = "Failed to unregister. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error unregistering:", err);
            }
          });
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // reload activities so the new participant shows up immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
