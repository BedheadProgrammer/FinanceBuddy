
import { useEffect } from "react";

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      const meta = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]'
      );
      if (meta) {
        meta.setAttribute("content", description);
      }
    }
  }, [title, description]);
}
