export function validatePaymentProofInput(data) {
  const errors = {};

  const contributionId = data.contributionId?.trim();
  const fileUrl = data.fileUrl?.trim();
  const fileName = data.fileName?.trim();

  if (!contributionId) {
    errors.contributionId = "Contribution ID is required";
  }

  if (!fileUrl) {
    errors.fileUrl = "File URL is required";
  }

  if (!fileName) {
    errors.fileName = "File name is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      contributionId,
      fileUrl,
      fileName,
    },
  };
}