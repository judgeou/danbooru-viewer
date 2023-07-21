import { kv } from "@vercel/kv"
import { config } from 'dotenv'

config()

export default async function handler (req, res) {
  const { name, value } = req.query
  const r = await kv.set(name + '_hasRead', value);

  res.status(200).json(r)
}