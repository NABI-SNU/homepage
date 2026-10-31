-- Rebuilds the footer links to mirror the header navigation and fix broken links
-- ("References" pointed to /bibliography; "Seminar" pointed to the book instead of /seminars).
-- Footer is a Payload global (id 1); only its secondary links and columns are replaced.
BEGIN;
DELETE FROM footer_columns_links WHERE _parent_id IN (SELECT id FROM footer_columns WHERE _parent_id = 1);
DELETE FROM footer_columns WHERE _parent_id = 1;
DELETE FROM footer_secondary_links WHERE _parent_id = 1;
INSERT INTO footer_secondary_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (1, 1, '6a3cb41dea14781e67fc6aca', 'custom', NULL, '/about', 'About');
INSERT INTO footer_secondary_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (2, 1, '6a33968e0dec517ae1345104', 'custom', NULL, '/contact', 'Contact');
INSERT INTO footer_columns (_order, _parent_id, id, title) VALUES (1, 1, '6a39c2d3b07728ce98102fff', 'Community');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (1, '6a39c2d3b07728ce98102fff', '6a3b6ed5a58332bda8341274', 'custom', NULL, '/people', 'People');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (2, '6a39c2d3b07728ce98102fff', '6a3ae60166e2394e7430d786', 'custom', NULL, '/charter', 'Charter');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (3, '6a39c2d3b07728ce98102fff', '6a388f124d0e846361891932', 'custom', NULL, '/announcements', 'Announcements');
INSERT INTO footer_columns (_order, _parent_id, id, title) VALUES (2, 1, '6a37bfc6d3ef994c077ee7ae', 'Activities');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (1, '6a37bfc6d3ef994c077ee7ae', '6a389a3fe49289f36e00bf10', 'custom', NULL, '/seminars', 'Seminars');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (2, '6a37bfc6d3ef994c077ee7ae', '6a33df5d53d1270319ceb294', 'custom', NULL, '/symposium', 'Symposium');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (3, '6a37bfc6d3ef994c077ee7ae', '6a336a64a5c0edfee0098526', 'custom', NULL, '/conferences', 'Conferences');
INSERT INTO footer_columns (_order, _parent_id, id, title) VALUES (3, 1, '6a3b8d9a9d53d1e652c998ab', 'Articles');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (1, '6a3b8d9a9d53d1e652c998ab', '6a3f9000c0e46830a9025304', 'custom', NULL, '/posts', 'All Posts');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (2, '6a3b8d9a9d53d1e652c998ab', '6a3fa9ac030ac7cdbd139fa6', 'custom', NULL, '/category/monthly-meeting', 'Monthly Meetings');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (3, '6a3b8d9a9d53d1e652c998ab', '6a3ca6e9418234b9513d5313', 'custom', NULL, '/category/opinions', 'Opinions');
INSERT INTO footer_columns (_order, _parent_id, id, title) VALUES (4, 1, '6a38dfb7141b931911bf5116', 'Resources');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (1, '6a38dfb7141b931911bf5116', '6a3d985e4b432f3976eae9b7', 'custom', true, 'https://book.nabilab.org', 'Book');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (2, '6a38dfb7141b931911bf5116', '6a3b467b1fa0fdde72f05238', 'custom', NULL, '/labs', 'Notebooks');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (3, '6a38dfb7141b931911bf5116', '6a334f2d4320af3de67655fd', 'custom', NULL, '/references', 'Bibliography');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (4, '6a38dfb7141b931911bf5116', '6a3181f90a0d2423b7462725', 'custom', NULL, '/wiki', 'Wiki');
INSERT INTO footer_columns_links (_order, _parent_id, id, link_type, link_new_tab, link_url, link_label) VALUES (5, '6a38dfb7141b931911bf5116', '6a3e7cf49c0e2ed7d350b9ea', 'custom', NULL, '/news', 'News');
UPDATE footer SET updated_at = now() WHERE id = 1;
COMMIT;
