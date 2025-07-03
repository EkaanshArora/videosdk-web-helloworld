import KJUR from "jsrsasign";
import * as fabric from "fabric";

// You should sign your JWT with a backend service in a production use-case
export function generateSignature(sessionName: string, role: number, sdkKey: string, sdkSecret: string) {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const oHeader = { alg: "HS256", typ: "JWT" };

  const oPayload = {
    app_key: sdkKey,
    tpc: sessionName,
    role_type: role,
    version: 1,
    iat: iat,
    exp: exp,
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  const sdkJWT = KJUR.KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);
  return sdkJWT;
}

export async function getBitmap(message: string) {
  // Create a canvas element
  const canvas = new fabric.Canvas(document.createElement("canvas"), {
    width: 1280,
    height: 720,
  });

  // Create text object
  const text = new fabric.Text(message, {
    left: 10,
    top: 10,
    fontSize: 60,
    fill: "red",
  });

  canvas.add(text);
  canvas.renderAll();

  // Convert to ImageBitmap
  const dataUrl = canvas.toDataURL();
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);
  return imageBitmap;
}