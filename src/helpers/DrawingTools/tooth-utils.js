// Helper function to calculate the center point of a segmentation
export const calculateCenter = (segmentation) => {
  let sumX = 0
  let sumY = 0

  for (const point of segmentation) {
    sumX += point.x
    sumY += point.y
  }

  return {
    x: sumX / segmentation.length,
    y: sumY / segmentation.length,
  }
}

// Function to find adjacent teeth based on segmentation proximity
export const findAdjacentTeeth = (targetTooth, teethAnnotations) => {
  // Get the target tooth's segmentation
  const targetSegmentation = targetTooth.segmentation || targetTooth.bounding_box || targetTooth.vertices
  if (!targetSegmentation) return { left: null, right: null }

  // Calculate the center point of the target tooth
  const targetCenter = calculateCenter(targetSegmentation)
  const targetNumber = Number.parseInt(targetTooth.label)

  // Determine if we're in upper or lower jaw
  const isUpperJaw = targetNumber >= 1 && targetNumber <= 16
  const isLowerJaw = targetNumber >= 17 && targetNumber <= 32

  // Filter teeth in the same jaw
  const sameJawTeeth = teethAnnotations.filter((tooth) => {
    const toothNumber = Number.parseInt(tooth.label)
    return (
      (isUpperJaw && toothNumber >= 1 && toothNumber <= 16) || (isLowerJaw && toothNumber >= 17 && toothNumber <= 32)
    )
  })

  // Find teeth to the left and right
  let leftTooth = null
  let rightTooth = null
  let minLeftDistance = Number.POSITIVE_INFINITY
  let minRightDistance = Number.POSITIVE_INFINITY

  for (const tooth of sameJawTeeth) {
    // Skip the target tooth
    if (tooth === targetTooth) continue

    const toothSegmentation = tooth.segmentation || tooth.bounding_box || tooth.vertices
    if (!toothSegmentation) continue

    const toothCenter = calculateCenter(toothSegmentation)

    // Calculate horizontal distance
    const horizontalDistance = toothCenter.x - targetCenter.x

    // Check if tooth is to the left
    if (horizontalDistance < 0) {
      const distance = Math.abs(horizontalDistance)
      if (distance < minLeftDistance) {
        minLeftDistance = distance
        leftTooth = tooth
      }
    }
    // Check if tooth is to the right
    else if (horizontalDistance > 0) {
      if (horizontalDistance < minRightDistance) {
        minRightDistance = horizontalDistance
        rightTooth = tooth
      }
    }
  }

  return { left: leftTooth, right: rightTooth }
}

