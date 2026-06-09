import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Loader2 } from "lucide-react";
import { listProductReviews, upsertReview, deleteMyReview } from "../../lib/reviews.functions";
import { useAuth } from "../../lib/auth-store";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export function ProductReviews({ productId, isAr }: { productId: string; isAr: boolean }) {
  const listFn = useServerFn(listProductReviews);
  const upsertFn = useServerFn(upsertReview);
  const deleteFn = useServerFn(deleteMyReview);
  const qc = useQueryClient();
  const auth = useAuth();
  const userId = auth.user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => listFn({ data: { product_id: productId } }),
  });

  const reviews = data?.reviews ?? [];
  const myReview = userId ? reviews.find((r) => r.user_id === userId) : undefined;

  const [rating, setRating] = useState(myReview?.rating ?? 5);
  const [title, setTitle] = useState(myReview?.title ?? "");
  const [comment, setComment] = useState(myReview?.comment ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await upsertFn({ data: { product_id: productId, rating, title, comment } });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["reviews", productId] }),
        qc.invalidateQueries({ queryKey: ["product"] }),
      ]);
      toast.success(isAr ? "تم حفظ مراجعتك" : "Review saved");
    } catch (e: any) {
      toast.error(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(isAr ? "حذف المراجعة؟" : "Delete review?")) return;
    setBusy(true);
    try {
      await deleteFn({ data: { product_id: productId } });
      await qc.invalidateQueries({ queryKey: ["reviews", productId] });
      setTitle(""); setComment(""); setRating(5);
      toast.success(isAr ? "تم الحذف" : "Deleted");
    } finally { setBusy(false); }
  };

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <h2 className="font-display font-black text-2xl md:text-3xl mb-6">
        {isAr ? "آراء القرّاء" : "Reader reviews"}
      </h2>

      {userId ? (
        <div className="bg-card border border-border rounded-2xl p-5 mb-8">
          <p className="text-sm font-semibold mb-2">
            {myReview ? (isAr ? "عدّل مراجعتك" : "Edit your review") : (isAr ? "اكتب مراجعتك" : "Write a review")}
          </p>
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map((n) => (
              <button key={n} onClick={() => setRating(n)} type="button">
                <Star className={cn("h-7 w-7", n <= rating ? "fill-gold text-gold" : "text-muted")} />
              </button>
            ))}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={isAr ? "عنوان (اختياري)" : "Title (optional)"}
            className="w-full h-10 px-3 mb-2 rounded-md border border-input bg-background" />
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
            placeholder={isAr ? "شاركنا رأيك..." : "Share your thoughts..."}
            className="w-full px-3 py-2 mb-3 rounded-md border border-input bg-background" />
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy}
              className="h-10 px-5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAr ? "نشر" : "Publish"}
            </button>
            {myReview && (
              <button onClick={remove} disabled={busy}
                className="h-10 px-5 rounded-md border border-border hover:bg-muted text-destructive font-semibold">
                {isAr ? "حذف" : "Delete"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-muted/40 border border-border rounded-xl p-4 mb-8 text-sm">
          <Link to="/auth" className="text-primary font-semibold">
            {isAr ? "سجّل دخول" : "Sign in"}
          </Link>{" "}
          {isAr ? "لكتابة مراجعة." : "to write a review."}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {isAr ? "لا توجد مراجعات بعد. كن أول من يراجع!" : "No reviews yet."}
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{r.user_name}</p>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-gold text-gold" : "text-muted")} />
                    ))}
                  </div>
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                </time>
              </div>
              {r.title && <p className="font-semibold mb-1">{r.title}</p>}
              {r.comment && <p className="text-foreground/80 leading-relaxed">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
