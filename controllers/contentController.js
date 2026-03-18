import connection from "../db/dbConnection.js"

//--------------INDEX CONTENT
function indexContent(req, res, next) {

    const category = req.query.category;
    const search = req.query.search;

    //voglio mostare i contents in base alle category 

    let query = `SELECT contents.*, img_sub.cover_image, poi.latitude, poi.longitude
        FROM contents
        LEFT JOIN points_of_interest AS poi ON contents.id = poi.content_id 
        LEFT JOIN (
            SELECT content_id, url AS cover_image
            FROM img
            WHERE (content_id, img_position) IN (
                SELECT content_id, MIN(img_position)
                FROM img
                GROUP BY content_id
            )
        ) AS img_sub ON contents.id = img_sub.content_id
        WHERE contents.is_visible = 1`

    //CREO UN ARRAY PARAMS DOVE AGGIUNGERE le Category
    let params = []

    //FILTRI DINAMICI
    //filtro per categoria
    if (category) {
        query += " AND contents.category =?";
        params.push(category);
    }

    // filtro per titolo/categoria/tag
    if (search) {
        query += " AND (contents.category LIKE ? OR contents.title LIKE ? OR contents.tag LIKE ? OR contents.description LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm)

    }


    //CONNECTION
    connection.query(query, params, (err, result) => {
        if (err) return next(err);
        return res.json({
            category: category || "all",
            total: result.length,
            results: result
        })
    })
}





//--------------SHOW CONTENT
function showContent(req, res, next) {
    const { slug } = req.params;

    /*
     APPROCCIO: Query base +img--> Query dinamiche per categoria che restituisce dettagli DIVERSI in base alla categoria del content:
      1.cosa-mangiare → food (ricetta, ingredienti, dove mangiare).
      2.luoghi-da-visitare → points_of_interest (coordinate, indirizzo)
      3.eventi → events (location, date)
      4.storia-e-tradizioni → solo itinerari correlati
     */


    const baseQuery = `
        SELECT
    c.id,
    c.title,
    c.slug,
    c.description,
    c.category,
    c.video_url,
    c.reading_time,
    c.is_visible,
    c.tag,

    GROUP_CONCAT(DISTINCT img.url ORDER BY img.img_position ASC) AS images_raw
    FROM contents AS c
    LEFT JOIN img ON img.content_id = c.id
    WHERE c.slug = ? AND c.is_visible = 1
    GROUP BY c.id
    LIMIT 1;
    `;

    connection.query(baseQuery, [slug], (err, contents) => {
        if (err) return next(err);
        if (contents.length === 0) {
            res.status(404);
            return res.json({ error: "404 NOT FOUND", message: "Contenuto non trovato" });
        }

        const content = contents[0];
        const contentId = content.id;
        const category = content.category;

        // Step 2: Prepara risposta base
        let responseData = { ...content };

        // === IMMAGINI ===
        // images_raw viene ottenuto dalla query base (GROUP_CONCAT) e va trasformato in un array.
        responseData.images = [];
        if (content.images_raw) {
            responseData.images = content.images_raw
                .split(",")
                .filter(Boolean)
                .map(filename => ({
                    url: `/images/${filename.trim()}`,
                    thumbnail: `/images/${filename.trim()}`,
                }));
        }
        delete responseData.images_raw;

        /**
         * Step 3: Esegui una query dinamica per la categoria (food / poi / events / altro)
         * e includi direttamente anche gli itinerari collegati.
         *
         * Questo ci permette di mantenere il controller semplice (solo 2 query totali):
         * 1) baseQuery (content + immagini),
         * 2) detailsQuery (dettagli categoria + itinerari).
         */
        let detailsQuery;

        if (category === "cosa-mangiare") {
            detailsQuery = `
SELECT
  f.id AS food_id,
  f.recipe,
  f.ingredients,
  f.where_to_eat,
  f.season,
  f.pairing
FROM food AS f
WHERE f.content_id = ?
GROUP BY f.id;
`;
        } else if (category === "luoghi-da-visitare") {
            detailsQuery = `
SELECT
  GROUP_CONCAT(DISTINCT CONCAT_WS('||', poi.id, poi.latitude, poi.longitude, poi.address, poi.minor_point_of_interest) SEPARATOR ';;') AS poi_raw
FROM points_of_interest AS poi
WHERE poi.content_id = ?
GROUP BY poi.content_id;
`;
        } else if (category === "eventi") {
            detailsQuery = `
SELECT
  GROUP_CONCAT(DISTINCT CONCAT_WS('||', ev.id, ev.location, ev.date) SEPARATOR ';;') AS events_raw
FROM events AS ev
WHERE ev.content_id = ?
GROUP BY ev.content_id;
`;
        } else {
            // Per categorie che non hanno tabelle dedicate, non recuperiamo niente
            detailsQuery = null;
        }

        if (!detailsQuery) {
            // Per categorie senza dettagli specifici, restituisci subito la risposta base
            return res.json(responseData);
        }

        connection.query(detailsQuery, [contentId], (err, detailsRows) => {
            if (err) return next(err);

            const row = detailsRows[0] || {};

            // Food
            if (category === "cosa-mangiare") {
                responseData.food = row.food_id ? {
                    id: row.food_id,
                    recipe: row.recipe,
                    ingredients: row.ingredients,
                    where_to_eat: row.where_to_eat,
                    season: row.season,
                    pairing: row.pairing,
                } : null;
            }

            // Luoghi da visitare
            if (category === "luoghi-da-visitare") {
                responseData.points_of_interest = [];
                if (row.poi_raw) {
                    responseData.points_of_interest = row.poi_raw
                        .split(";;")
                        .filter(Boolean)
                        .map(item => {
                            const [id, latitude, longitude, address, minor_point_of_interest] = item.split("||");
                            return {
                                id: id ? Number(id) : null,
                                latitude: latitude ? Number(latitude) : null,
                                longitude: longitude ? Number(longitude) : null,
                                address: address || null,
                                minor_point_of_interest: minor_point_of_interest || null,
                            };
                        });
                }
            }

            // Eventi
            if (category === "eventi") {
                responseData.events = [];
                if (row.events_raw) {
                    responseData.events = row.events_raw
                        .split(";;")
                        .filter(Boolean)
                        .map(item => {
                            const [id, location, date] = item.split("||");
                            return {
                                id: id ? Number(id) : null,
                                location: location || null,
                                date: date || null,
                            };
                        });
                }
            }

            return res.json(responseData);
        });
    });
}

//-------------------EXPORT FUNCTIONS CONTENT
export default { indexContent, showContent }