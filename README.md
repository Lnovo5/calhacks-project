# calhacks-project
Calhacks 12.0 Team Project
<!-- Replace saveInjuryLog implementation with this variant that uses addDoc -->
async function saveInjuryLog(e) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to save injuries.');
        return;
    }

    const location = document.getElementById('location').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!location || !notes) {
        alert('Please fill in both location and notes.');
        return;
    }

    try {
        const injuryData = {
            location: location,
            notes: notes,
            timestamp: Date.now() // or serverTimestamp() if you want Firestore Timestamp
        };

        // Use addDoc to append to the user's injuries collection
        const injuriesCollection = collection(db, 'users', user.uid, 'injuries');
        const docRef = await addDoc(injuriesCollection, injuryData);

        console.log('✅ Injury saved (addDoc):', docRef.id, injuryData);

        // Clear form
        document.getElementById('location').value = '';
        document.getElementById('notes').value = '';

        alert('Injury report saved successfully!');

        // Reload history
        await loadInjuryHistory();

    } catch (error) {
        console.error('❌ Error saving injury:', error);
        alert('Failed to save injury. Please try again.');
    }
}
Team Members
1. Lucia Novo
2. Ethan Le
3. Muhammad Bazil
- Roles/Tasks TBD

## Tech
- Claude AI
- Firebase
- Gemini
- Github- Copilot 
## Setup

## Plan
Backend - Lucia Novi.
Frontend - Muhammad Bazil.
Researcher / Critical thinker - Ethan Le.

CIP - Congenital Insensitivity to Pain
- Using AI to help people with this condition
- Tracks a person's daily activities (user can log in their actions)
- Catches abnormal patterns in these activities
- AI suggests ways to improve behavior
- Like helper animals (makes life a little easier for disabled people)
- Prototype will send alerts (we're still figuring out how to do this or what language to use)
- May need to use Javascript for alerts
- HTML/CSS for website prototype with calendar/timer/stopwatch?
