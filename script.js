/******************************************************
 * JEE Percentile Predictor (Frontend)
 * Backend-powered via Vercel Serverless
 ******************************************************/

async function predict() {
  const shift = document.getElementById("shift").value;
  const marks = document.getElementById("marks").value;
  const resultDiv = document.getElementById("result");
  const rankDiv = document.getElementById("rank");

  // Basic frontend validation
  if (!shift || marks === "") {
    resultDiv.innerHTML = "❌ Enter valid shift and marks.";
    return;
  }

  resultDiv.innerHTML = "⏳ Calculating...";

  try {
    const res = await fetch(`/api/predict?shift=${encodeURIComponent(shift)}&marks=${encodeURIComponent(marks)}`);
    const data = await res.json();

    if (!res.ok) {
      resultDiv.innerHTML = "❌ " + (data.error || "Invalid input");
      return;
    }
const lowerlim = Math.floor((100-data.percentile)*1500000/100);
const upperlim = Math.floor((100-data.percentile)*1600000/100);
    resultDiv.innerHTML = `
      🎯 Predicted Percentile:<br>
      <span style="color:#4facfe">${data.percentile}</span>
    `;
    rankDiv.innerHTML = `
    Your predicted rank is between:<br>
    <span style="color:#4facfe">${lowerlim}-${upperlim}</span>
    `;

  } catch (err) {
    resultDiv.innerHTML = "❌ Server error. Try again.";
  }
}
