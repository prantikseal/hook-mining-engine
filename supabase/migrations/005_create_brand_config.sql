-- Brand configuration — single row, JSONB for flexible nested structure
CREATE TABLE IF NOT EXISTS brand_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle TEXT NOT NULL DEFAULT '@pixii_ai',
    name TEXT NOT NULL DEFAULT 'Pixii',
    tagline TEXT NOT NULL DEFAULT 'AI-powered product visuals for e-commerce sellers',
    website TEXT NOT NULL DEFAULT 'pixii.ai',
    instagram TEXT NOT NULL DEFAULT 'https://www.instagram.com/pixii_ai/',
    product_description TEXT NOT NULL DEFAULT 'Pixii is an AI design platform that generates high-converting product visuals, lifestyle imagery, and listing content for e-commerce sellers. It works across Amazon, Shopify, TikTok Shop, Walmart, and Etsy.',
    key_features TEXT[] NOT NULL DEFAULT '{
        "AI product photography — studio-quality shots without a studio",
        "Listing image generation — A+ content, infographics, lifestyle scenes",
        "Background removal and replacement",
        "AI-generated lifestyle imagery for products",
        "Batch processing — generate visuals for entire catalogs",
        "Platform-optimized outputs (Amazon, Shopify, TikTok Shop, Walmart)"
    }',
    target_audience JSONB NOT NULL DEFAULT '{
        "primary": ["Amazon FBA sellers","Shopify store owners","TikTok Shop sellers","Walmart Marketplace sellers","Etsy sellers"],
        "secondary": ["Product photographers transitioning to AI","E-commerce brand managers","Dropshippers","Private label sellers","Small business owners selling online"],
        "demographics": "25-45, US/India/UK/Australia/Europe, English-speaking",
        "pain_points": ["Product photos are expensive ($50-500 per product)","Hiring photographers is slow and inconsistent","DIY photos look amateur and hurt conversions","Listing images don''t stand out in crowded marketplaces","Scaling visual content across 100+ SKUs is impossible manually"]
    }',
    voice JSONB NOT NULL DEFAULT '{
        "personality": "Confident, practical, slightly bold — like a growth marketer who ships fast",
        "do": ["Be specific with numbers and results","Use e-commerce jargon naturally","Reference real seller struggles","Make Pixii feel like an insider tool, not a corporate product"],
        "dont": ["Sound corporate or salesy","Use filler phrases","Be vague","Over-promise"]
    }',
    content_pillars TEXT[] NOT NULL DEFAULT '{
        "Before/After transformations (bad product photos vs Pixii-generated)",
        "Seller success tips (with Pixii as the tool behind the tip)",
        "Behind-the-scenes of how top sellers create listing images",
        "Platform-specific hacks (Amazon A+ content, TikTok Shop visuals)",
        "Cost comparison (traditional photography vs AI-generated)"
    }',
    ctas TEXT[] NOT NULL DEFAULT '{
        "Try Pixii free — link in bio",
        "Your first 5 images are on us — link in bio",
        "Comment PIXII and I''ll send you the link",
        "Save this and try it tonight",
        "Tag a seller friend who needs this",
        "Follow @pixii_ai for more seller hacks"
    }',
    branded_hashtag TEXT NOT NULL DEFAULT 'pixiiai',
    core_hashtags TEXT[] NOT NULL DEFAULT '{ecommerce,amazonfba,shopify,productphotography,aitools,onlinebusiness,sellonline,amazonsellertools,ecommercetools,tiktokshop,listingoptimization,productimages,aidesign,ecommerceseller}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default row if table is empty
INSERT INTO brand_config (handle)
SELECT '@pixii_ai'
WHERE NOT EXISTS (SELECT 1 FROM brand_config);
