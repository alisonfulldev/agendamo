-- The coupon of a WhatsApp sale, so a new Pix (the first one expired) keeps the same price.
alter table public.assisted_sales
  add column coupon_code text check (coupon_code is null or char_length(coupon_code) <= 40);
