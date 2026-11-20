/**
 * PulseChain Supply Chain Helper Utilities
 */

export const MEDICINE_METADATA = {
  INS001: {
    name: 'Insulin Glargine',
    category: 'Endocrinology / Critical',
    dosage: '100 U/mL 10mL',
    criticalThreshold: 5,
  },
  AMX002: {
    name: 'Amoxicillin Trihydrate',
    category: 'Broad-Spectrum Antibiotic',
    dosage: '500mg IV Vial',
    criticalThreshold: 5,
  },
  PROP003: {
    name: 'Propofol IV Emulsion',
    category: 'ICU / General Anesthetic',
    dosage: '10mg/mL 20mL',
    criticalThreshold: 5,
  },
  HEP004: {
    name: 'Heparin Sodium',
    category: 'Anticoagulant / Emergency',
    dosage: '5,000 IU/mL 5mL',
    criticalThreshold: 5,
  },
  SAL005: {
    name: '0.9% Normal Saline',
    category: 'IV Fluid Resuscitation',
    dosage: '1,000 mL Infusion Bag',
    criticalThreshold: 5,
  },
};

export const HOSPITAL_METADATA = {
  H001: {
    name: 'Metro Health Central',
    region: 'North Sector',
    tier: 'Level 1 Trauma',
    color: 'border-blue-500/30',
  },
  H002: {
    name: "St. Luke's Memorial",
    region: 'East District',
    tier: 'Community Care',
    color: 'border-cyan-500/30',
  },
  H003: {
    name: 'Mercy General Medical',
    region: 'South Hub',
    tier: 'Tertiary Referral',
    color: 'border-emerald-500/30',
  },
  H004: {
    name: 'Cedars Regional Medical',
    region: 'West Valley',
    tier: 'Surgical Center',
    color: 'border-purple-500/30',
  },
  H005: {
    name: "University Children's Hospital",
    region: 'Central Metro',
    tier: 'Specialty Pediatric',
    color: 'border-amber-500/30',
  },
};

/**
 * Calculates days of cover strictly using Math.floor(STOCK_QTY / DAILY_USE)
 */
export const calculateDaysCover = (stockQty, dailyUse) => {
  if (!dailyUse || dailyUse <= 0) return 999;
  return Math.floor(stockQty / dailyUse);
};

/**
 * Finds donor hospitals with surplus inventory (> 10 days cover) for the requested material
 */
export const findSurplusDonors = (allStock, targetHospitalId, materialId) => {
  return allStock
    .filter(
      (item) =>
        item.MATERIAL_ID === materialId &&
        item.HOSPITAL_ID !== targetHospitalId &&
        calculateDaysCover(item.STOCK_QTY, item.DAILY_USE) > 10
    )
    .map((donor) => {
      const donorDays = calculateDaysCover(donor.STOCK_QTY, donor.DAILY_USE);
      // Safe surplus is stock beyond 10 days cover
      const safeSurplusUnits = Math.max(0, donor.STOCK_QTY - donor.DAILY_USE * 10);
      return {
        ...donor,
        daysCover: donorDays,
        safeSurplusUnits,
      };
    })
    .sort((a, b) => b.safeSurplusUnits - a.safeSurplusUnits);
};

/**
 * Suggests an autonomous reallocation plan to bring target hospital to 8-10 days cover
 */
export const suggestAutonomousReallocation = (allStock, targetItem) => {
  const targetDays = calculateDaysCover(targetItem.STOCK_QTY, targetItem.DAILY_USE);
  const donors = findSurplusDonors(allStock, targetItem.HOSPITAL_ID, targetItem.MATERIAL_ID);

  if (donors.length === 0) {
    return {
      possible: false,
      reason: 'No hospital in network currently holds surplus (> 10 days cover) for this material.',
    };
  }

  const primaryDonor = donors[0];

  // Desired target days cover: 8 days (safe baseline)
  const targetDesiredDays = 8;
  const neededUnits = Math.max(
    targetItem.DAILY_USE * 3, // At least 3 days buffer replenishment
    (targetDesiredDays - targetDays) * targetItem.DAILY_USE
  );

  // Transfer quantity capped by donor's safe surplus
  const recommendedTransfer = Math.min(neededUnits, primaryDonor.safeSurplusUnits);

  return {
    possible: recommendedTransfer > 0,
    primaryDonor,
    allDonors: donors,
    recommendedTransfer: Math.max(recommendedTransfer, targetItem.DAILY_USE * 2),
    targetProjectedStock: targetItem.STOCK_QTY + recommendedTransfer,
    targetProjectedDays: calculateDaysCover(
      targetItem.STOCK_QTY + recommendedTransfer,
      targetItem.DAILY_USE
    ),
    donorProjectedStock: primaryDonor.STOCK_QTY - recommendedTransfer,
    donorProjectedDays: calculateDaysCover(
      primaryDonor.STOCK_QTY - recommendedTransfer,
      primaryDonor.DAILY_USE
    ),
  };
};

