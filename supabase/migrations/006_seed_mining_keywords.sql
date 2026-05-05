-- Update mining_config with researched hashtags and search keywords for better hook mining

-- TikTok: broader hashtags + keyword search queries
UPDATE mining_config SET
    hashtags = ARRAY[
        'amazonfba',
        'ecommercetips',
        'tiktokmademebuyit',
        'tiktokshopseller',
        'productphotography',
        'smallbusinesstips',
        'amazonseller',
        'shopifytips',
        'onlinebusiness',
        'sellertips'
    ],
    search_queries = ARRAY[
        'product photography tips',
        'AI product photos',
        'ecommerce listing images',
        'Amazon FBA tips',
        'how to take product photos',
        'product photography on a budget',
        'AI tools for sellers',
        'ecommerce side hustle',
        'TikTok Shop seller',
        'online business mistakes',
        'why your listings aren''t converting',
        'seller hack',
        'before and after product photos',
        'stop doing this if you sell online',
        'what I wish I knew selling online'
    ],
    updated_at = now()
WHERE platform = 'tiktok';

-- Instagram: focused hashtags (Instagram caps at 5 per post) + keyword search queries
UPDATE mining_config SET
    hashtags = ARRAY[
        'ecommerceseller',
        'amazonfba',
        'productphotography',
        'aitools',
        'smallbusinessowner'
    ],
    search_queries = ARRAY[
        'product photography tips',
        'AI product photos ecommerce',
        'Amazon listing optimization',
        'how to take product photos',
        'product photos that convert',
        'ecommerce mistakes',
        'Shopify store tips',
        'online business tips',
        'AI tools for sellers',
        'first sale on Amazon',
        'seller hack ecommerce',
        'before and after product photos'
    ],
    updated_at = now()
WHERE platform = 'instagram';
