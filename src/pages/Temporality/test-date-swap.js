// Simple test to verify date swapping logic

// Mock date objects similar to what DateSlider would provide
const firstDateObj = {
  date: "Jan 01, 2023",
  visitIds: ["visit1"]
};

const secondDateObj = {
  date: "Feb 01, 2023",
  visitIds: ["visit2"]
};

// Test case 1: Second date is newer than first date (no swap needed)
console.log("Test case 1: Second date is newer than first date (no swap needed)");
let testFirstDate = { ...firstDateObj };
let testSecondDate = { ...secondDateObj };

const firstDate1 = new Date(testFirstDate.date);
const secondDate1 = new Date(testSecondDate.date);

console.log("Before comparison:");
console.log("First date:", testFirstDate.date);
console.log("Second date:", testSecondDate.date);

if (secondDate1 < firstDate1) {
  console.log("Swapping dates because second date is earlier than first date");
  
  // Swap the date objects
  const tempDateObj = testFirstDate;
  testFirstDate = testSecondDate;
  testSecondDate = tempDateObj;
}

console.log("After comparison:");
console.log("First date:", testFirstDate.date);
console.log("Second date:", testSecondDate.date);

// Test case 2: Second date is older than first date (swap needed)
console.log("\nTest case 2: Second date is older than first date (swap needed)");
testFirstDate = { ...secondDateObj }; // Feb 01, 2023
testSecondDate = { ...firstDateObj }; // Jan 01, 2023

const firstDate2 = new Date(testFirstDate.date);
const secondDate2 = new Date(testSecondDate.date);

console.log("Before comparison:");
console.log("First date:", testFirstDate.date);
console.log("Second date:", testSecondDate.date);

if (secondDate2 < firstDate2) {
  console.log("Swapping dates because second date is earlier than first date");
  
  // Swap the date objects
  const tempDateObj = testFirstDate;
  testFirstDate = testSecondDate;
  testSecondDate = tempDateObj;
}

console.log("After comparison:");
console.log("First date:", testFirstDate.date);
console.log("Second date:", testSecondDate.date);
