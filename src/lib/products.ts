/**
 * Helper katalog & gambar produk percetakan FD Digital Printing.
 * Menghubungkan gambar dari database atau fallback ke foto foto berkualitas tinggi
 * yang realistis dan spesifik untuk setiap jenis layanan digital printing.
 */

export const DEFAULT_PRODUCT_IMAGES: Record<string, string> = {
	banner: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=700&q=80', // Roll-up / standing banner cetak
	korea: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=80', // Banner Korea tebal & halus
	stiker: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=700&q=80', // Cetak stiker vinyl & potong kiss cut
	chromo: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=700&q=80', // Stiker chromo label kemasan
	brosur: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=700&q=80', // Cetak brosur / flyer lipat 3
	kartu: 'https://images.unsplash.com/photo-1589330694653-dad6d3240a91?auto=format&fit=crop&w=700&q=80', // Kartu nama premium box
	foto: 'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=700&q=80', // Cetak foto glossy resolusi tinggi
	default: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=700&q=80' // Mesin percetakan digital profesional
};

export function getProductImageUrl(item: { name: string; imageUrl?: string | null }): string {
	if (item.imageUrl && item.imageUrl.trim().length > 0) {
		return item.imageUrl.trim();
	}
	const n = item.name.toLowerCase();
	if (n.includes('korea')) return DEFAULT_PRODUCT_IMAGES.korea;
	if (n.includes('banner') || n.includes('spanduk')) return DEFAULT_PRODUCT_IMAGES.banner;
	if (n.includes('chromo')) return DEFAULT_PRODUCT_IMAGES.chromo;
	if (n.includes('stiker')) return DEFAULT_PRODUCT_IMAGES.stiker;
	if (n.includes('brosur') || n.includes('flyer')) return DEFAULT_PRODUCT_IMAGES.brosur;
	if (n.includes('kartu')) return DEFAULT_PRODUCT_IMAGES.kartu;
	if (n.includes('foto')) return DEFAULT_PRODUCT_IMAGES.foto;
	return DEFAULT_PRODUCT_IMAGES.default;
}
