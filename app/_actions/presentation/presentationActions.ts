"use server";

import { type PlateSlide } from "@/components/presentation/utils/parser";
import { auth } from "@/server/auth";
import { db, withDbRetry } from "@/server/db";
import { type InputJsonValue } from "@prisma/client/runtime/library";

export async function createPresentation({
  content,
  title,
  theme = "default",
  outline,
  imageSource,
  presentationStyle,
  language,
}: {
  content: {
    slides: PlateSlide[];
  };
  title: string;
  theme?: string;
  outline?: string[];
  imageSource?: string;
  presentationStyle?: string;
  language?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const userId = session.user.id;

  try {
    // Resolve a valid user id to satisfy FK: prefer id, else email, else create
    let effectiveUserId = userId;
    const existingById = await withDbRetry(() => db.user.findUnique({ where: { id: userId }, select: { id: true } }));
    if (!existingById) {
      const email = session.user.email ?? undefined;
      if (email) {
        const existingByEmail = await withDbRetry(() => db.user.findUnique({ where: { email }, select: { id: true } }));
        if (existingByEmail) {
          effectiveUserId = existingByEmail.id;
        } else {
          try {
            const created = await withDbRetry(() => db.user.create({
              data: {
                id: userId,
                email,
                name: session.user.name ?? undefined,
                image: session.user.image ?? undefined,
              },
              select: { id: true },
            }));
            effectiveUserId = created.id;
          } catch {
            // As a last resort, try to read by email again (in case of race)
            const fallback = email
              ? await withDbRetry(() => db.user.findUnique({ where: { email }, select: { id: true } }))
              : null;
            effectiveUserId = fallback?.id ?? userId;
          }
        }
      } else {
        // No email in session; create a minimal user row keyed by id
        try {
          const created = await withDbRetry(() => db.user.create({
            data: { id: userId, name: session.user.name ?? undefined, image: session.user.image ?? undefined },
            select: { id: true },
          }));
          effectiveUserId = created.id;
        } catch {
          effectiveUserId = userId;
        }
      }
    }
    const presentation = await withDbRetry(() => db.baseDocument.create({
      data: {
        type: "PRESENTATION",
        documentType: "presentation",
        title: title ?? "Untitled Presentation",
        userId: effectiveUserId,
        presentation: {
          create: {
            content: content as unknown as InputJsonValue,
            theme: theme,
            imageSource,
            presentationStyle,
            language,
            outline: outline,
          },
        },
      },
      include: {
        presentation: true,
      },
    }));

    return {
      success: true,
      message: "Presentation created successfully",
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to create presentation",
    };
  }
}

export async function createEmptyPresentation(
  title: string,
  theme = "default",
  language = "en-US",
) {
  const emptyContent: { slides: PlateSlide[] } = { slides: [] };

  return createPresentation({
    content: emptyContent,
    title,
    theme,
    language,
  });
}

export async function updatePresentation({
  id,
  content,
  prompt,
  title,
  theme,
  outline,
  searchResults,
  imageSource,
  presentationStyle,
  language,
  thumbnailUrl,
}: {
  id: string;
  content?: {
    slides: PlateSlide[];
    config: Record<string, unknown>;
  };
  title?: string;
  theme?: string;
  prompt?: string;
  outline?: string[];
  searchResults?: Array<{ query: string; results: unknown[] }>;
  imageSource?: string;
  presentationStyle?: string;
  language?: string;
  thumbnailUrl?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    // Extract values from content if provided there
    const effectiveTheme = theme;
    const effectiveImageSource = imageSource;
    const effectivePresentationStyle = presentationStyle;
    const effectiveLanguage = language;

    // Update base document with all presentation data
    const presentation = await db.baseDocument.update({
      where: { id },
      data: {
        title: title,
        thumbnailUrl,
        presentation: {
          update: {
            prompt: prompt,
            content: content as unknown as InputJsonValue,
            theme: effectiveTheme,
            imageSource: effectiveImageSource,
            presentationStyle: effectivePresentationStyle,
            language: effectiveLanguage,
            outline,
            searchResults: searchResults as unknown as InputJsonValue,
          },
        },
      },
      include: {
        presentation: true,
      },
    });

    return {
      success: true,
      message: "Presentation updated successfully",
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation",
    };
  }
}

export async function updatePresentationTitle(id: string, title: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const presentation = await db.baseDocument.update({
      where: { id },
      data: { title },
      include: {
        presentation: true,
      },
    });

    return {
      success: true,
      message: "Presentation title updated successfully",
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation title",
    };
  }
}

export async function deletePresentation(id: string) {
  return deletePresentations([id]);
}

export async function deletePresentations(ids: string[]) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    // Delete the base documents using deleteMany (this will cascade delete the presentations)
    const result = await db.baseDocument.deleteMany({
      where: {
        id: {
          in: ids,
        },
        userId: session.user.id, // Ensure only user's own presentations can be deleted
      },
    });

    const deletedCount = result.count;
    const failedCount = ids.length - deletedCount;

    if (failedCount > 0) {
      return {
        success: deletedCount > 0,
        message:
          deletedCount > 0
            ? `Deleted ${deletedCount} presentations, failed to delete ${failedCount} presentations`
            : "Failed to delete presentations",
        partialSuccess: deletedCount > 0,
      };
    }

    return {
      success: true,
      message:
        ids.length === 1
          ? "Presentation deleted successfully"
          : `${deletedCount} presentations deleted successfully`,
    };
  } catch (error) {
    console.error("Failed to delete presentations:", error);
    return {
      success: false,
      message: "Failed to delete presentations",
    };
  }
}

// Get the presentation with the presentation content
export async function getPresentation(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const presentation = await db.baseDocument.findUnique({
      where: { id },
      include: {
        presentation: true,
      },
    });

    return {
      success: true,
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to fetch presentation",
    };
  }
}

export async function getPresentationContent(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const presentation = await db.baseDocument.findUnique({
      where: { id },
      include: {
        presentation: {
          select: {
            id: true,
            content: true,
            theme: true,
            outline: true,
          },
        },
      },
    });

    if (!presentation) {
      return {
        success: false,
        message: "Presentation not found",
      };
    }

    // Check if the user has access to this presentation
    if (presentation.userId !== session.user.id && !presentation.isPublic) {
      return {
        success: false,
        message: "Unauthorized access",
      };
    }

    return {
      success: true,
      presentation: presentation.presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to fetch presentation",
    };
  }
}

export async function updatePresentationTheme(id: string, theme: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const presentation = await db.presentation.update({
      where: { id },
      data: { theme },
    });

    return {
      success: true,
      message: "Presentation theme updated successfully",
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation theme",
    };
  }
}

export async function duplicatePresentation(id: string, newTitle?: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    // Get the original presentation
    const original = await withDbRetry(() => db.baseDocument.findUnique({
      where: { id },
      include: {
        presentation: true,
      },
    }));

    if (!original?.presentation) {
      return {
        success: false,
        message: "Original presentation not found",
      };
    }

    // Resolve a valid user id for duplicate as well
    let effectiveUserId = session.user.id;
    const byId = await withDbRetry(() => db.user.findUnique({ where: { id: session.user.id }, select: { id: true } }));
    if (!byId) {
      const email = session.user.email ?? undefined;
      if (email) {
        const byEmail = await withDbRetry(() => db.user.findUnique({ where: { email }, select: { id: true } }));
        if (byEmail) effectiveUserId = byEmail.id;
        else {
          try {
            const created = await withDbRetry(() => db.user.create({
              data: { id: session.user.id, email, name: session.user.name ?? undefined, image: session.user.image ?? undefined },
              select: { id: true },
            }));
            effectiveUserId = created.id;
          } catch {
            const fallback = await withDbRetry(() => db.user.findUnique({ where: { email }, select: { id: true } }));
            effectiveUserId = fallback?.id ?? session.user.id;
          }
        }
      }
    }

    // Create a new presentation with the same content
    const duplicated = await withDbRetry(() => db.baseDocument.create({
      data: {
        type: "PRESENTATION",
        documentType: "presentation",
        title: newTitle ?? `${original.title} (Copy)`,
        userId: effectiveUserId,
        isPublic: false,
        presentation: {
          create: {
            content: (original.presentation?.content ?? {}) as unknown as InputJsonValue,
            theme: original.presentation?.theme ?? undefined,
          },
        },
      },
      include: {
        presentation: true,
      },
    }));

    return {
      success: true,
      message: "Presentation duplicated successfully",
      presentation: duplicated,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to duplicate presentation",
    };
  }
}
