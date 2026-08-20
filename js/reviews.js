(function () {
  const cfg = window.REVIEWS_CONFIG || {};
  const isConfigured = cfg.supabaseUrl && !cfg.supabaseUrl.includes("PASTE_YOUR");

  if (!isConfigured) {
    const list = document.getElementById("reviews-list");
    if (list) {
      list.innerHTML =
        '<div class="text-testimonial-note2">Reviews are not configured yet.</div>';
    }
    const form = document.getElementById("review-form");
    if (form) form.hidden = true;
    return;
  }

  const supabase = window.supabase.createClient(
    cfg.supabaseUrl,
    cfg.supabaseAnonKey
  );

  const listEl = document.getElementById("reviews-list");
  const form = document.getElementById("review-form");
  const starPicker = document.getElementById("star-picker");
  const descEl = document.getElementById("review-desc");
  const charEl = document.getElementById("review-char");
  const descError = document.getElementById("desc-error");
  const ratingError = document.getElementById("rating-error");
  const formError = document.getElementById("form-error");
  const successEl = document.getElementById("review-success");
  const submitBtn = document.getElementById("review-submit");

  let rating = 0;

  function show(el, msg) {
    el.textContent = msg || "";
    el.hidden = !msg;
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function starRow(rating) {
    let s = "";
    for (let i = 1; i <= 5; i++) {
      s +=
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="' +
        (i <= rating ? 'currentColor' : 'rgba(120,120,130,0.25)') +
        '"><path d="M12 2l2.9 6.26 6.6.7-5 4.4 1.5 6.5L12 16.9 5.9 19.9l1.5-6.5-5-4.4 6.6-.7z"/></svg>';
    }
    return s;
  }

  async function loadReviews() {
    if (!listEl) return;
    const { data, error } = await supabase
      .from("reviews")
      .select("name, rating, description, avatar_url, images, video_url, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("reviews load error:", error);
      return;
    }
    if (!data.length) return;

    listEl.innerHTML = data
      .map((r) => {
        const media = [];
        const imgs = Array.isArray(r.images) ? r.images : [];
        imgs.forEach((u) => {
          if (u) media.push('<img src="' + esc(u) + '" alt="" loading="lazy">');
        });
        if (r.video_url) {
          media.push(
            '<video src="' + esc(r.video_url) + '" controls preload="metadata"></video>'
          );
        }
        const avatar = r.avatar_url
          ? '<img src="' + esc(r.avatar_url) + '" alt="" class="review-avatar-img">'
          : '<div class="review-avatar-letter">' + esc((r.name || "?").charAt(0).toUpperCase()) + "</div>";
        return (
          '<figure class="review-card">' +
          '<div class="review-stars">' + starRow(r.rating) + "</div>" +
          '<blockquote class="text-testimonial-quote">' + esc(r.description) + "</blockquote>" +
          (media.length ? '<div class="review-media">' + media.join("") + "</div>" : "") +
          '<figcaption class="testimonial-meta">' +
          '<div class="review-avatar">' + avatar + "</div>" +
          "<div><div class=\"text-testimonial-name\">" + esc(r.name) + "</div>" +
          '<div class="text-testimonial-role">' + fmtDate(r.created_at) + "</div></div>" +
          "</figcaption></figure>"
        );
      })
      .join("");
  }

  function checkDesc() {
    const len = descEl.value.trim().length;
    const min = cfg.minDescLength || 80;
    charEl.textContent = len + " / " + min;
    if (len > 0 && len < min) {
      show(descError, "Please write at least " + min + " characters about what I helped you with.");
    } else {
      show(descError, null);
    }
    return len >= min;
  }

  function fileTooBig(file, maxMb) {
    return file.size > maxMb * 1024 * 1024;
  }

  async function uploadFile(file, path, bucket) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  starPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".star");
    if (!btn) return;
    rating = parseInt(btn.dataset.value, 10);
    starPicker.querySelectorAll(".star").forEach((s) => {
      s.classList.toggle("on", parseInt(s.dataset.value, 10) <= rating);
    });
    show(ratingError, null);
  });

  descEl.addEventListener("input", checkDesc);

  function t(key) {
    const lang = document.documentElement.lang || "en";
    const dict = (window.SITE && window.SITE.t && window.SITE.t[lang]) || {};
    return dict[key];
  }

  document.querySelectorAll(".file-upload-input").forEach((input) => {
    input.addEventListener("change", () => {
      const nameEl = document.querySelector('[data-file-name="' + input.id + '"]');
      if (!nameEl) return;
      const files = Array.from(input.files || []);
      if (!files.length) {
        nameEl.textContent = input.multiple ? t("review.noFiles") || "No files chosen" : t("review.noFile") || "No file chosen";
        return;
      }
      if (files.length === 1) {
        nameEl.textContent = files[0].name;
      } else {
        nameEl.textContent = files.length + " " + (t("review.filesChosen") || "files chosen");
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    show(formError, null);

    const name = document.getElementById("review-name").value.trim();
    if (!name) return show(formError, "Please enter your name.");

    if (!rating) {
      return show(ratingError, "Please pick a rating.");
    }

    if (!checkDesc()) {
      return show(descError, "Please write at least " + (cfg.minDescLength || 80) + " characters about what I helped you with.");
    }

    const avatarFile = document.getElementById("review-avatar").files[0];
    const imageFiles = Array.from(document.getElementById("review-images").files || []);
    const videoFile = document.getElementById("review-video").files[0];

    for (const f of imageFiles) {
      if (fileTooBig(f, cfg.maxImageMb || 5)) {
        return show(formError, '"' + f.name + '" is over ' + (cfg.maxImageMb || 5) + " MB.");
      }
    }
    if (avatarFile && fileTooBig(avatarFile, cfg.maxImageMb || 5)) {
      return show(formError, "Profile logo is over " + (cfg.maxImageMb || 5) + " MB.");
    }
    if (videoFile && fileTooBig(videoFile, cfg.maxVideoMb || 10)) {
      return show(formError, "Video is over " + (cfg.maxVideoMb || 10) + " MB.");
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";

    try {
      const stamp = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const folder = "reviews/" + rand + stamp;

      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadFile(avatarFile, folder + "/avatar" + ext(avatarFile), cfg.storageBucket || "review-files");
      }

      const imageUrls = [];
      for (const f of imageFiles) {
        imageUrls.push(await uploadFile(f, folder + "/img" + imageUrls.length + ext(f), cfg.storageBucket || "review-files"));
      }

      let videoUrl = null;
      if (videoFile) {
        videoUrl = await uploadFile(videoFile, folder + "/video" + ext(videoFile), cfg.storageBucket || "review-files");
      }

      const { data, error } = await supabase.rpc("submit_review", {
        p_name: name,
        p_rating: rating,
        p_description: descEl.value.trim(),
        p_avatar_url: avatarUrl,
        p_images: imageUrls,
        p_video_url: videoUrl,
      });

      if (error) throw error;

      // Send moderation email via edge function
      try {
        const modalRes = await fetch(`${cfg.supabaseUrl}/functions/v1/moderate-review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "INSERT",
            table: "reviews",
            record: { id: data.id }
          })
        });
        const modalData = await modalRes.json();
        console.log("Moderation email triggered:", modalRes.status);
      } catch (err) {
        console.error("Moderation email error:", err);
        // Don't fail the whole submission if email fails
      }

      form.hidden = true;
      successEl.hidden = false;
      successEl.dataset.reviewId = data.id;
    } catch (err) {
      console.error("review submit error:", err);
      show(formError, "Something went wrong sending your review. Please try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit review";
    }
  });

  function ext(f) {
    const m = f.name.match(/\.([a-zA-Z0-9]+)$/);
    return m ? "." + m[1].toLowerCase() : "";
  }

  loadReviews();
})();