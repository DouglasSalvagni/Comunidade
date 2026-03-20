"use server";

export async function getAuthProvidersStatus() {
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const appleId = process.env.APPLE_CLIENT_ID;

  return {
    hasGoogle: !!googleId && googleId.trim() !== "" && googleId !== "your_google_client_id",
    hasApple: !!appleId && appleId.trim() !== "" && appleId !== "your_apple_client_id",
  };
}
