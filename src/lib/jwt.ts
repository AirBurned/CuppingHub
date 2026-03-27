import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret'
)

export interface JWTPayload {
  userId: string
  username: string
  role: string
  name: string
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}
