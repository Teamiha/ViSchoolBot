import { REDIRECT_URI } from "../config.ts";

// const REDIRECT_URI = "https://mikhail-butlerbot-63.deno.dev/oauth2callback";



// const REDIRECT_URI = "http://localhost:8000/oauth2callback";

const CLIENT_ID = "560125731996-01q2h00k2dcn5p6a1ur40q7n8l64ha9s.apps.googleusercontent.com";

async function authenticate() {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly"
  );
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", "admin");

  console.log("Перейдите по этой ссылке для авторизации админа:");
  console.log(authUrl.toString());

  console.log(
    "После авторизации и перенаправления на REDIRECT_URI, убедитесь, что токены сохранены в Deno.KV.",
  );
}

authenticate();
