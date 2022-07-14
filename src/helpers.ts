
export const validateObjectProperty = (obj: any, propName: string, propType: any) => {
  if (obj && obj[propName] !== undefined) {
    if (typeof propType === "string") {
      if (typeof obj[propName] === propType) return true;
    } else {
      if (obj[propName] instanceof propType) return true;
    }
  }
  throw new Error(`Object missing ${propName} field`);
};