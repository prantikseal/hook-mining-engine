-- Remove hooks that have no thumbnail image
DELETE FROM generated_scripts
WHERE hook_id IN (
    SELECT id FROM hooks WHERE thumbnail_url IS NULL
);

DELETE FROM hooks WHERE thumbnail_url IS NULL;
