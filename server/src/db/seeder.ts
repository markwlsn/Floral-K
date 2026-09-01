import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export function seedDatabase(db: Database.Database): void {
  // 1. Seed Users if not present
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const superAdminHash = bcrypt.hashSync('SuperAdmin123!', salt);
    const ownerHash = bcrypt.hashSync('Owner123!', salt);
    const adminHash = bcrypt.hashSync('Admin123!', salt);
    const customerHash = bcrypt.hashSync('Customer123!', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    insertUser.run('Elena Vance (Super Admin)', 'superadmin@floralk.com', superAdminHash, 'super_admin', '+1 (555) 901-0001');
    insertUser.run('Klara Kensington (Owner)', 'owner@floralk.com', ownerHash, 'owner', '+1 (555) 901-0002');
    insertUser.run('Liam Rivera (Lead Florist & Admin)', 'admin@floralk.com', adminHash, 'admin', '+1 (555) 901-0003');
    insertUser.run('Sophia Miller (Customer)', 'customer@example.com', customerHash, 'customer', '+1 (555) 901-0004');
  }

  // 2. Seed Categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCount.count === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (name, slug, description, image_url, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertCat.run(
      'Romance & Roses',
      'romance-roses',
      'Velvety premium roses, passionate hues, and romantic arrangements tailored to steal hearts.',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      1
    );
    insertCat.run(
      'Birthday & Celebrations',
      'birthday-celebrations',
      'Joyous, vibrant bursts of color crafted to make milestone days unforgettable.',
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      2
    );
    insertCat.run(
      'Luxury Orchids & Exotics',
      'luxury-orchids',
      'Exquisite phalaenopsis orchids and architectural botanicals in ceramic artisan vessels.',
      'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80',
      3
    );
    insertCat.run(
      'Sympathy & Grace',
      'sympathy-grace',
      'Serene whites, gentle cremes, and soothing greens offering heartfelt warmth and solace.',
      'https://images.unsplash.com/photo-1533616688419-b7a585564566?auto=format&fit=crop&w=800&q=80',
      4
    );
    insertCat.run(
      'Dried & Everlasting',
      'dried-everlasting',
      'Sun-cured pampas, preserved eucalyptus, and ethereal stems that radiate warmth for years.',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
      5
    );
    insertCat.run(
      'Gift Boxes & Hampers',
      'gift-boxes',
      'Curated floral gift sets paired with organic artisan candles, botanic mist, and macarons.',
      'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80',
      6
    );
  }

  // 3. Seed Products
  const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  let hasOrigin = 0;
  try {
    const check = db.prepare("SELECT COUNT(*) as count FROM products WHERE origin IS NOT NULL").get() as { count: number };
    hasOrigin = check.count;
  } catch {
    hasOrigin = 0;
  }

  if (prodCount.count < 12 || hasOrigin === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (
        name, slug, sku, category_id, price, compare_at_price, cost_price, stock,
        min_stock_alert, description, short_description, images, flower_types,
        occasion_tags, care_instructions, origin, scent_notes, dimensions,
        stem_recipe, is_featured, is_available, barcode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(sku) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        category_id = excluded.category_id,
        price = excluded.price,
        compare_at_price = excluded.compare_at_price,
        cost_price = excluded.cost_price,
        stock = excluded.stock,
        min_stock_alert = excluded.min_stock_alert,
        description = excluded.description,
        short_description = excluded.short_description,
        images = excluded.images,
        flower_types = excluded.flower_types,
        occasion_tags = excluded.occasion_tags,
        care_instructions = excluded.care_instructions,
        origin = excluded.origin,
        scent_notes = excluded.scent_notes,
        dimensions = excluded.dimensions,
        stem_recipe = excluded.stem_recipe,
        is_featured = excluded.is_featured,
        is_available = excluded.is_available,
        barcode = excluded.barcode
    `);

    const products = [
      {
        name: 'The Scarlet Royale (24 Long-Stem Ecuadorian Red Roses)',
        slug: 'the-scarlet-royale',
        sku: 'FK-ROM-001',
        category_id: 1,
        price: 129.0,
        compare_at_price: 149.0,
        cost_price: 45.0,
        stock: 35,
        min_stock_alert: 8,
        description: 'Two dozen hand-selected Ecuadorian long-stem scarlet roses nestled in lush salal greens and Italian ruscus, bound with our signature copper silk ribbon. Grown in volcanic microclimates, each bloom boasts dense velvety petals that unfurl with breathtaking symmetry.',
        short_description: '24 Ecuadorian scarlet roses with Italian ruscus & copper silk wrap.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1548094878-84ced0f68c08?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['Ecuadorian Red Roses', 'Italian Ruscus', 'Hypericum Berries']),
        occasion_tags: JSON.stringify(['Romance', 'Anniversary', 'Valentine', 'Proposal']),
        care_instructions: 'Trim stems at a 45-degree angle every 2 days. Replenish with chilled fresh water and included botanical nutrition.',
        origin: 'Cayambe Volcanic Slopes, Ecuador (2,800m altitude). Fair-trade certified rainforest reserve.',
        scent_notes: 'Top: Crisp Morning Dew; Heart: Classic Velvety Damask Rose; Base: Warm Honeyed Amber.',
        dimensions: 'Stem length: 65cm (26"). Bouquet diameter: 45cm (18"). Best displayed in a 24-28cm cylindrical vase.',
        stem_recipe: '24x Freedom Long-Stem Red Roses, 6x Italian Ruscus, 4x Seeded Eucalyptus, 4x Hypericum Berries.',
        is_featured: 1,
        is_available: 1,
        barcode: '890123400101'
      },
      {
        name: 'Midnight Velvet (Bordeaux Garden Roses & Sarah Bernhardt Peonies)',
        slug: 'midnight-velvet-peony-rose',
        sku: 'FK-ROM-002',
        category_id: 1,
        price: 145.0,
        compare_at_price: 165.0,
        cost_price: 52.0,
        stock: 18,
        min_stock_alert: 5,
        description: 'Lush Bordeaux garden roses, blush Sarah Bernhardt peonies, and plum ranunculus crowned with trailing dark eucalyptus. Dramatic, seductive, and deeply romantic, this arrangement evokes the quiet grandeur of an evening masquerade.',
        short_description: 'Bordeaux garden roses, plush peonies, and plum ranunculus.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['Blush Peonies', 'Bordeaux Garden Roses', 'Plum Ranunculus', 'Seeded Eucalyptus']),
        occasion_tags: JSON.stringify(['Romance', 'Date Night', 'Luxury Gifting']),
        care_instructions: 'Keep in a cool room away from direct heat or air vents. Lightly mist peony petals in early morning.',
        origin: 'Loire Valley, France & San Remo, Italy. Cut at dawn and transported under strict cold-chain.',
        scent_notes: 'Top: Crushed Blackcurrant; Heart: French Peony & Wild Plum; Base: Soft Cedarwood.',
        dimensions: 'Stem length: 55cm (22"). Bouquet diameter: 40cm (16"). Pairs elegantly with a 20cm smoked glass urn vase.',
        stem_recipe: '12x Bordeaux Garden Roses, 8x Sarah Bernhardt Blush Peonies, 6x Plum Ranunculus, 4x Dark Seeded Eucalyptus.',
        is_featured: 1,
        is_available: 1,
        barcode: '890123400102'
      },
      {
        name: 'Golden Hour Radiance (California Sunflowers & Coral Ranunculus)',
        slug: 'golden-hour-citrus-burst',
        sku: 'FK-CEL-001',
        category_id: 2,
        price: 88.0,
        compare_at_price: 99.0,
        cost_price: 28.0,
        stock: 24,
        min_stock_alert: 6,
        description: 'An effervescent celebration of pure sunshine: radiant coral ranunculus, golden mammoth sunflowers, lemon spray roses, and scented mint foliage. Guaranteed to fill any room with uninhibited optimism.',
        short_description: 'Coral ranunculus, sunny sunflowers, and lemon spray roses.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['Sunflowers', 'Coral Ranunculus', 'Lemon Spray Roses', 'Fresh Mint']),
        occasion_tags: JSON.stringify(['Birthday', 'Congratulations', 'Get Well Soon', 'Celebration']),
        care_instructions: 'Change water every 24-48 hours. Sunflowers drink heavily and prefer a generous vase of fresh water.',
        origin: 'Sonoma Valley, California. Organically grown in solar-powered coastal fields.',
        scent_notes: 'Top: Wild Lemon Verbena & Crushed Mint; Heart: Sunny Marigold; Base: Green Stem.',
        dimensions: 'Stem length: 50cm (20"). Bouquet diameter: 38cm (15"). Best paired with a 20cm flared ceramic pitcher.',
        stem_recipe: '5x Mammoth Sunflowers, 8x Coral Ranunculus, 6x Lemon Spray Roses, 4x Organic Wild Mint Foliage.',
        is_featured: 1,
        is_available: 1,
        barcode: '890123400201'
      },
      {
        name: 'Pastel Confetti Birthday Bloom (Lavender Roses & Cloud Hydrangeas)',
        slug: 'pastel-confetti-birthday-bloom',
        sku: 'FK-CEL-002',
        category_id: 2,
        price: 95.0,
        compare_at_price: 110.0,
        cost_price: 32.0,
        stock: 30,
        min_stock_alert: 5,
        description: 'Soft lavender ocean song roses, powder-pink Dutch cloud hydrangeas, cream delphiniums, and fluttery lisianthus artfully arranged in our recyclable matte ivory gift presentation.',
        short_description: 'Lavender roses, powder-pink hydrangeas & cream delphinium.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['Lavender Roses', 'Pink Hydrangea', 'Cream Delphinium', 'White Lisianthus']),
        occasion_tags: JSON.stringify(['Birthday', 'Friendship', 'Just Because']),
        care_instructions: 'Submerge hydrangea heads briefly in cold water if they appear thirsty after transit.',
        origin: 'Aalsmeer, The Netherlands. Auction reserve grade Dutch greenhouse blossoms.',
        scent_notes: 'Top: Crisp Green Apple; Heart: Lavender Blossom & Powder Rose; Base: Soft Cotton.',
        dimensions: 'Stem length: 50cm (20"). Bouquet diameter: 42cm (17"). Best paired with a 20cm matte porcelain vase.',
        stem_recipe: '10x Ocean Song Lavender Roses, 2x Jumbo Powder-Pink Hydrangeas, 6x Cream Delphiniums, 5x White Lisianthus.',
        is_featured: 0,
        is_available: 1,
        barcode: '890123400202'
      },
      {
        name: 'The Imperial Double Orchid Cascade (Twin Grand Phalaenopsis in Glazed Ceramic)',
        slug: 'imperial-double-orchid-planter',
        sku: 'FK-ORC-001',
        category_id: 3,
        price: 135.0,
        compare_at_price: 155.0,
        cost_price: 48.0,
        stock: 14,
        min_stock_alert: 4,
        description: 'Twin grand white Phalaenopsis orchid cascades with multiple blooming nodes, potted in living Spanish moss and black glazed ceramic. Lasts 8 to 12 weeks with minimal care, embodying eternal refinement.',
        short_description: 'Double cascade white Phalaenopsis in glazed ceramic.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1533616688419-b7a585564566?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['Phalaenopsis Orchids', 'Spanish Moss', 'Pebble Dressing']),
        occasion_tags: JSON.stringify(['Housewarming', 'Luxury Gifting', 'Corporate', 'Anniversary']),
        care_instructions: 'Place 3 ice cubes per orchid stem once a week. Bright indirect sunlight only.',
        origin: 'Nantou Botanical Reserve, Taiwan. Microclimate acclimated specimens.',
        scent_notes: 'Subtle clean botanical ozone with a whisper of sweet vanilla orchid pollen.',
        dimensions: 'Overall height: 75cm (30"). Planter diameter: 22cm (8.5"). Heavy stoneware planter included.',
        stem_recipe: '2x Grand Multi-Spike White Phalaenopsis Orchids (16-20 open blooms), Spanish Live Moss dressing, river pebble bed.',
        is_featured: 1,
        is_available: 1,
        barcode: '890123400301'
      },
      {
        name: 'Kyoto Zen Bonsai & Cymbidium Orchid (Rare Green Cymbidium & Japanese Moss)',
        slug: 'kyoto-zen-bonsai-cymbidium',
        sku: 'FK-ORC-002',
        category_id: 3,
        price: 160.0,
        compare_at_price: 185.0,
        cost_price: 58.0,
        stock: 10,
        min_stock_alert: 3,
        description: 'A striking union of rare chartreuse Cymbidium orchid spikes, dwarf Japanese juniper bonsai, and lush live cushion moss arranged on a handcrafted basalt slate slab.',
        short_description: 'Rare chartreuse Cymbidium orchid and juniper bonsai on basalt slate.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1545232979-fbf68fe9b1a8?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['Green Cymbidium Orchids', 'Juniper Bonsai', 'Cushion Moss']),
        occasion_tags: JSON.stringify(['Executive', 'Housewarming', 'Modernist', 'Zen']),
        care_instructions: 'Mist cushion moss twice weekly. Water orchid base sparingly every 10 days.',
        origin: 'Kyoto Prefecture, Japan. Traditional nursery specimen.',
        scent_notes: 'Forest canopy, fresh rain on river stone, clean green tea leaf.',
        dimensions: 'Height: 60cm (24"). Width: 32cm (13"). Natural basalt slate base included.',
        stem_recipe: '1x Rare Green Cymbidium Orchid Spike (12 open bells), 1x Preserved Juniper Bonsai, Living Cushion Moss.',
        is_featured: 1,
        is_available: 1,
        barcode: '890123400302'
      },
      {
        name: 'Serene Haven (Oriental Casablanca Lilies & Vendela Ivory Roses)',
        slug: 'serene-haven-white-lily-rose',
        sku: 'FK-SYM-001',
        category_id: 4,
        price: 110.0,
        compare_at_price: 125.0,
        cost_price: 36.0,
        stock: 22,
        min_stock_alert: 5,
        description: 'Pristine oriental Casablanca lilies, ivory Vendela roses, white snapdragons, and lush salal foliage. A quiet, dignified arrangement that conveys heartfelt sympathy and enduring peace.',
        short_description: 'Casablanca lilies, ivory Vendela roses & snapdragons.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1533616688419-b7a585564566?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['Casablanca Lilies', 'Vendela White Roses', 'Snapdragons', 'Silver Dollar Eucalyptus']),
        occasion_tags: JSON.stringify(['Sympathy', 'Condolences', 'Grace', 'Peace']),
        care_instructions: 'Carefully remove yellow lily stamens as buds open to prevent petal staining.',
        origin: 'Bogotá Savanna, Colombia. Rain-fed sustainable mountain greenhouse.',
        scent_notes: 'Top: Night-blooming Jasmine; Heart: Opulent White Lily; Base: Frankincense & Sandalwood.',
        dimensions: 'Stem length: 65cm (26"). Arrangement diameter: 48cm (19"). Best displayed in a 25cm frosted white vessel.',
        stem_recipe: '6x Oriental Casablanca Lilies (18 buds/blooms), 12x Vendela Cream Roses, 8x White Snapdragons, Salal & Silver Dollar.',
        is_featured: 0,
        is_available: 1,
        barcode: '890123400401'
      },
      {
        name: 'Terracotta Dunes Preserved Floral Cloud (Bleached Ruscus & Sand Pampas)',
        slug: 'terracotta-dunes-preserved-floral',
        sku: 'FK-DRY-001',
        category_id: 5,
        price: 85.0,
        compare_at_price: 95.0,
        cost_price: 26.0,
        stock: 28,
        min_stock_alert: 6,
        description: 'Naturally dried bleached Italian ruscus, fluffy sand pampas grass, terracotta bunny tails, and preserved baby’s breath. Requires zero water and maintains its organic sculptured grace for 2+ years.',
        short_description: 'Dried pampas, bleached ruscus & terracotta bunny tails.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['Pampas Grass', 'Italian Ruscus', 'Bunny Tails', 'Preserved Gypsophila']),
        occasion_tags: JSON.stringify(['Home Decor', 'Birthday', 'Boho Chic', 'Long Lasting']),
        care_instructions: 'Keep away from humidity and direct sunlight. Dust gently with a blow dryer on cool low setting.',
        origin: 'Tuscan Hills, Italy. Air-cured with zero toxic dyes.',
        scent_notes: 'Sun-warmed linen, dry desert sage, soothing natural straw.',
        dimensions: 'Height: 55cm (22"). Width: 35cm (14"). Everlasting (lasts 2+ years without water).',
        stem_recipe: '6x Bleached Italian Ruscus, 4x Fluffy Sand Pampas Plumes, 12x Terracotta Bunny Tails, Preserved Starflowers.',
        is_featured: 1,
        is_available: 1,
        barcode: '890123400501'
      },
      {
        name: 'Nordic Eucalyptus & Wild Cotton Everlasting (Silver Dollar & Preserved Fluff)',
        slug: 'nordic-eucalyptus-wild-cotton',
        sku: 'FK-DRY-002',
        category_id: 5,
        price: 78.0,
        compare_at_price: 90.0,
        cost_price: 24.0,
        stock: 30,
        min_stock_alert: 5,
        description: 'Preserved baby blue eucalyptus stems, organic raw cotton bolls on woody branches, and ivory dried starflowers. A clean, minimalist Scandinavian statement for the modern home.',
        short_description: 'Preserved silver dollar eucalyptus, raw cotton bolls & dried starflowers.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['Preserved Eucalyptus', 'Raw Cotton', 'Dried Starflower']),
        occasion_tags: JSON.stringify(['Home Decor', 'Minimalist', 'Housewarming', 'Nordic']),
        care_instructions: 'No water required. Display in a dry room out of direct humidity.',
        origin: 'Gothenburg, Sweden. Naturally preserved using vegetal glycerin.',
        scent_notes: 'Subtle fresh mountain eucalyptus, crisp cedar pine, clean winter air.',
        dimensions: 'Height: 50cm (20"). Width: 30cm (12"). Everlasting (lasts 2+ years).',
        stem_recipe: '8x Preserved Baby Blue Eucalyptus, 5x Natural Raw Cotton Bolls, 10x Preserved White Larkspur, Dried Lagurus.',
        is_featured: 0,
        is_available: 1,
        barcode: '890123400502'
      },
      {
        name: 'The Botanist Artisan Hamper (Petite Hand-Tie, Fig Candle & Macarons)',
        slug: 'the-botanist-hamper-petite-bouquet',
        sku: 'FK-BOX-001',
        category_id: 6,
        price: 155.0,
        compare_at_price: 180.0,
        cost_price: 55.0,
        stock: 12,
        min_stock_alert: 3,
        description: 'A handcrafted pine keepsake box housing a fresh seasonal pastel posy, a 100% soy Fig & Wild Rose candle, French lavender room mist, and six artisanal macarons from Paris.',
        short_description: 'Curated gift box: fresh posy, soy candle, mist & macarons.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1548094878-84ced0f68c08?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['Spray Roses', 'Waxflower', 'Astrantia', 'Eucalyptus']),
        occasion_tags: JSON.stringify(['Self Care', 'Birthday', 'Thank You', 'Luxury Gifting']),
        care_instructions: 'Transfer petite bouquet to fresh water upon unboxing. Trim stems 1cm.',
        origin: 'Hand-assembled in our Atelier. Gourmet confections imported directly from Paris.',
        scent_notes: 'Wild Mediterranean Fig, Damask Rosewater, Warm Tahitian Vanilla Bean.',
        dimensions: 'Pine Box: 32cm x 24cm x 15cm. Features sliding acrylic lid and silk pull cord.',
        stem_recipe: 'Petite 10-Stem Pastel Garden Posy (Spray Roses, Astrantia, Waxflower), 1x 280g Hand-Poured Fig Candle, Box of 6 Parisian Macarons.',
        is_featured: 1,
        is_available: 1,
        barcode: '890123400601'
      },
      {
        name: 'Monet’s Garden Dutch Tulips (30 French Peony-Tulips in Ombré Pastel)',
        slug: 'monets-garden-dutch-tulips',
        sku: 'FK-CEL-003',
        category_id: 2,
        price: 105.0,
        compare_at_price: 120.0,
        cost_price: 34.0,
        stock: 25,
        min_stock_alert: 6,
        description: 'Thirty rare double-flowered peony tulips in delicate gradations of apricot, blush, lilac, and porcelain white. As they open, they reveal voluminous ruffled blooms reminiscent of Impressionist masterworks.',
        short_description: '30 double-bloom French peony tulips in gradient pastel tones.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['Double Peony Tulips', 'Sweet Pea', 'Mint Foliage']),
        occasion_tags: JSON.stringify(['Birthday', 'Spring', 'Mother’s Day', 'Just Because']),
        care_instructions: 'Tulips continue growing in the vase! Keep water chilled and top up daily.',
        origin: 'Keukenhof Valley, The Netherlands. Climate-controlled direct export.',
        scent_notes: 'Top: Crisp Spring Rain; Heart: Sweet Pea & Wild Honey; Base: Green Clover.',
        dimensions: 'Stem length: 45cm (18"). Bouquet diameter: 35cm (14"). Best paired with a 18cm flared glass bubble vase.',
        stem_recipe: '30x Rare Double-Bloom French Peony Tulips (Pastel Pink, Coral, Apricot & Pearl White), Fresh Mint.',
        is_featured: 1,
        is_available: 1,
        barcode: '890123400203'
      },
      {
        name: 'Perrier-Jouët Grand Brut & White Rose Hatbox (VIP Luxury Celebration)',
        slug: 'perrier-jouet-white-rose-hatbox',
        sku: 'FK-BOX-002',
        category_id: 6,
        price: 240.0,
        compare_at_price: 275.0,
        cost_price: 95.0,
        stock: 8,
        min_stock_alert: 2,
        description: 'Eighteen high-altitude White Explorer roses arranged in a custom velvet-lined circular presentation box, paired with a chilled 750ml bottle of Perrier-Jouët Grand Brut Champagne and 12 Marc de Champagne truffles.',
        short_description: '18 white Explorer roses, 750ml Perrier-Jouët & Marc de Champagne truffles.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80'
        ]),
        flower_types: JSON.stringify(['White Explorer Roses', 'Silver Brunia', 'Salal Greens']),
        occasion_tags: JSON.stringify(['VIP Luxury', 'Milestone Anniversary', 'Wedding Gift', 'Congratulations']),
        care_instructions: 'Roses are pre-conditioned in florist foam. Add half a cup of water to the center daily.',
        origin: 'Épernay, Champagne, France & Mount Kenya high altitude rose farms.',
        scent_notes: 'Top: Brioche & White Peach; Heart: Crisp Gardenia; Base: Pure White Rose Petals.',
        dimensions: 'Hatbox diameter: 30cm (12"). Height: 35cm (14"). Signature matte black embossed presentation box.',
        stem_recipe: '18x High-Altitude White Explorer Roses, 1x 750ml Perrier-Jouët Grand Brut, 1x Box of 12 Marc de Champagne Truffles.',
        is_featured: 1,
        is_available: 1,
        barcode: '890123400602'
      }
    ];

    for (const p of products) {
      insertProd.run(
        p.name,
        p.slug,
        p.sku,
        p.category_id,
        p.price,
        p.compare_at_price,
        p.cost_price,
        p.stock,
        p.min_stock_alert,
        p.description,
        p.short_description,
        p.images,
        p.flower_types,
        p.occasion_tags,
        p.care_instructions,
        p.origin,
        p.scent_notes,
        p.dimensions,
        p.stem_recipe,
        p.is_featured,
        p.is_available,
        p.barcode
      );
    }
  }

  // 4. Seed Discounts
  const discCount = db.prepare('SELECT COUNT(*) as count FROM discounts').get() as { count: number };
  if (discCount.count === 0) {
    const insertDisc = db.prepare(`
      INSERT INTO discounts (code, discount_type, value, min_spend, max_uses, used_count, is_active)
      VALUES (?, ?, ?, ?, ?, 0, 1)
    `);

    insertDisc.run('FLORAL10', 'percentage', 10.0, 50.0, 500);
    insertDisc.run('WELCOME20', 'fixed', 20.0, 100.0, 200);
    insertDisc.run('FREESHIP', 'fixed', 15.0, 75.0, 300);
    insertDisc.run('VIP15', 'percentage', 15.0, 120.0, 100);
  }

  // 5. Seed Store Settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM store_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const insertSetting = db.prepare(`
      INSERT INTO store_settings (key, value)
      VALUES (?, ?)
    `);

    insertSetting.run('store_name', 'Floral K Boutique & Atelier');
    insertSetting.run('store_tagline', 'Bespoke Fresh Blooms & Express Luxury Delivery');
    insertSetting.run('tax_rate', '0.0825'); // 8.25%
    insertSetting.run('standard_delivery_fee', '15.00');
    insertSetting.run('free_delivery_threshold', '120.00');
    insertSetting.run('store_phone', '+1 (555) 356-7255');
    insertSetting.run('store_email', 'concierge@floralk.com');
    insertSetting.run('store_address', '742 Blossom Boulevard, Floral District, New York, NY 10001');
    insertSetting.run('business_hours', JSON.stringify({
      monday_friday: '08:00 AM - 07:00 PM',
      saturday: '09:00 AM - 06:00 PM',
      sunday: '10:00 AM - 04:00 PM'
    }));
    insertSetting.run('pos_receipt_footer', 'Thank you for choosing Floral K! Share your bloom on Instagram @floralk.boutique');
  }

  // 6. Seed Initial Orders for Kanban & POS Demonstration
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
  if (orderCount.count === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, customer_id, customer_name, customer_email, customer_phone,
        order_type, status, payment_status, payment_method, subtotal, discount,
        delivery_fee, tax, total, delivery_date, delivery_time_slot,
        recipient_name, recipient_phone, delivery_address, card_message, notes,
        source, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, cost_price, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Order 1: Pending Web Order
    const order1 = insertOrder.run(
      'FK-20260905-1001',
      4,
      'Sophia Miller',
      'customer@example.com',
      '+1 (555) 901-0004',
      'online_delivery',
      'pending',
      'paid',
      'card',
      129.0,
      12.9,
      0.0,
      9.58,
      125.68,
      '2026-09-05',
      '2:00 PM - 5:00 PM',
      'Alexander Wright',
      '+1 (555) 888-1122',
      '450 Lexington Ave, Penthouse B, New York, NY',
      'Happy 5th Anniversary my love! Forever grateful for every moment with you.',
      'Please leave with building concierge if not home.',
      'web',
      null
    );

    insertItem.run(order1.lastInsertRowid, 1, 'The Scarlet Royale (24 Long-Stem Red Roses)', 'FK-ROM-001', 129.0, 45.0, 1, 129.0);

    // Order 2: Arranging Florist Order
    const order2 = insertOrder.run(
      'FK-20260905-1002',
      null,
      'Marcus Chen',
      'mchen@techventures.io',
      '+1 (555) 345-6789',
      'online_delivery',
      'arranging',
      'paid',
      'card',
      145.0,
      0.0,
      15.0,
      13.20,
      173.20,
      '2026-09-05',
      '10:00 AM - 1:00 PM',
      'Chloe Vance',
      '+1 (555) 234-9988',
      '88 Pine St, Suite 1400, New York, NY',
      'Wishing you the happiest birthday Chloe! You inspire all of us.',
      'Call upon arrival.',
      'web',
      null
    );

    insertItem.run(order2.lastInsertRowid, 2, 'Midnight Velvet Peony & Rose Symphony', 'FK-ROM-002', 145.0, 52.0, 1, 145.0);

    // Order 3: Completed POS Walk-in Sale
    const order3 = insertOrder.run(
      'FK-20260905-1003',
      null,
      'Walk-in Customer (Cashier Counter)',
      'walkin@floralk.com',
      '+1 (555) 000-1111',
      'pos_walkin',
      'delivered',
      'paid',
      'cash',
      88.0,
      0.0,
      0.0,
      7.26,
      95.26,
      '2026-09-05',
      'Immediate Walk-in',
      'Walk-in Customer',
      '+1 (555) 000-1111',
      'Floral K Boutique Storefront',
      'N/A - Direct POS Purchase',
      'Cash tendered: $100.00, Change: $4.74',
      'pos',
      3
    );

    insertItem.run(order3.lastInsertRowid, 3, 'Golden Hour Citrus Burst', 'FK-CEL-001', 88.0, 28.0, 1, 88.0);
  }
}
