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

        const content = contents[0];//il content sarà l'unico oggetto dell'array con slug=?
        const contentId = content.id;
        const category = content.category;

        // Step 2: Prepara risposta base
        let responseData = { ...content };

        // === IMMAGINI ===
        // se ci sono immagini nel contents allora trasformale da stringa (GROUP_CONCAT) ---> array.
        responseData.images = [];
        if (content.images_raw) {
            responseData.images = content.images_raw
                .split(",") //divide le stringhe
                .filter(Boolean) //elimina spazi vuoiti e i null
                .map(filename => ({  // aggiunge l'url
                    url: `/images/${filename.trim()}`,

                }));
        }
        delete responseData.images_raw; //elimino l'imag_raw perchè sostituito con l'array di url

        /*Query dinamica per la categoria (food / poi / events / altro)*/
        let detailsQuery = null;
        if (content.category === "cosa-mangiare") {
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
         poi.id,
         poi.latitude,
         poi.longitude,
        poi.address,
        poi.minor_point_of_interest
        FROM points_of_interest AS poi
        WHERE poi.content_id = ?`;

        } else if (category === "eventi") {
            detailsQuery = `
        SELECT id, location, date
        FROM events
        WHERE content_id = ?
        LIMIT 1`;

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
                responseData.points_of_interest = detailsRows.map(row => ({
                    id: row.id,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    address: row.address,
                    minor_point_of_interest: row.minor_point_of_interest,
                }));
            }

            // Eventi
            if (category === "eventi") {
                responseData.events = detailsRows.map(row => ({
                    id: row.id,
                    location: row.location,
                    date: row.date,
                }));
            }

            return res.json(responseData);
        });
    });
}

//-------------------EXPORT FUNCTIONS CONTENT
export default { indexContent, showContent }