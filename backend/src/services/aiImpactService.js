/**
 * Simple Rule-Based AI Impact Analysis Engine
 * Evaluates a Change Request and generates:
 * 1. Risk Score: Low, Medium, High
 * 2. Impact Level: Minor, Moderate, Critical
 * 3. Recommendation: Approve, Review Carefully, High Risk
 */

exports.analyze = (crData) => {
    let riskScore = 'Low';
    let impactLevel = 'Minor';
    let recommendation = 'Approve';
  
    const loc = crData.linesOfCodeModified || 0;
    const priority = crData.priorityLevel || 'Medium';
    const filesCount = crData.filesAffected ? crData.filesAffected.length : 0;
  
    // High Risk Rules
    if (loc > 500 || priority === 'Critical' || filesCount > 10) {
      riskScore = 'High';
      impactLevel = 'Critical';
      recommendation = 'High Risk - Requires Extensive Review';
    } 
    // Medium Risk Rules
    else if (loc > 100 || priority === 'High' || filesCount > 3) {
      riskScore = 'Medium';
      impactLevel = 'Moderate';
      recommendation = 'Review Carefully';
    }
  
    // Emergency Fix override
    if (crData.status === 'Emergency Fix') {
      riskScore = 'High';
      impactLevel = 'Critical';
      recommendation = 'Expedite - High Risk Fix';
    }
  
    return {
      riskScore,
      impactLevel,
      recommendation
    };
  };
