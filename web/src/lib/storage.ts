import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function uploadFileToBucket(args: {
  bucket: string;
  path: string;
  file: File;
  isPublic?: boolean;
}) {
  const admin = getSupabaseAdminClient();
  const buffer = Buffer.from(await args.file.arrayBuffer());

  const { error } = await admin.storage.from(args.bucket).upload(args.path, buffer, {
    contentType: args.file.type,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  if (args.isPublic) {
    const { data } = admin.storage.from(args.bucket).getPublicUrl(args.path);
    return data.publicUrl;
  }

  return args.path;
}
