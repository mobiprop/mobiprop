import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().trim().min(2, "Location name is required").max(150),
  region: z.string().trim().min(2, "Region is required").max(150),
  address: z.string().trim().min(5, "Address is required").max(300),
  postalCode: z.string().trim().min(1, "Postal code is required").max(20),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = createLocationSchema.partial();
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
