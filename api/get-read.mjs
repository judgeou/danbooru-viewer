import { kv } from "@vercel/kv"
import { config } from 'dotenv'

config()

export default async function handler (req, res) {
  const { name } = req.query
  const r = await kv.get(name + '_hasRead');

  res.status(200).json(r)
}