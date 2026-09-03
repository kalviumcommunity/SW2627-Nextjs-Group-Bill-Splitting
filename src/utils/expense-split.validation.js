import { validateManualSplit } from "./expense-split.js";

export function validateExpenseSplitInput(data) {
  const errors = {};

  const totalAmount = Number(data.totalAmount);
  const splitType = data.splitType;
  const members = data.members;

  if (
    data.totalAmount === undefined ||
    data.totalAmount === null ||
    data.totalAmount === ""
  ) {
    errors.totalAmount = "Total amount is required";
  } else if (Number.isNaN(totalAmount) || totalAmount <= 0) {
    errors.totalAmount = "Total amount must be greater than 0";
  }

  if (!splitType) {
    errors.splitType = "Split type is required";
  } else if (!["EQUAL", "MANUAL"].includes(splitType)) {
    errors.splitType = "Invalid split type";
  }

  if (!Array.isArray(members) || members.length === 0) {
    errors.members = "At least one member is required";
  }

  if (
    splitType === "MANUAL" &&
    Array.isArray(members) &&
    members.length > 0 &&
    !errors.totalAmount
  ) {
    const manualValidation = validateManualSplit(totalAmount, members);

    if (!manualValidation.isValid) {
      errors.members = manualValidation.message;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      totalAmount,
      splitType,
      members,
    },
  };
}