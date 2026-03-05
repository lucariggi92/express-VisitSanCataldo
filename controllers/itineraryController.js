import connection from "../db/dbConnection.js"

//--------------INDEX ITINERARY
function indexItinerary(req, res, next) {

    const query = `     
    SELECT itineraries.*, 
    COUNT(itineraries_contents.content_id) AS numero_tappe
    FROM itineraries
    LEFT JOIN itineraries_contents 
    ON itineraries.id = itineraries_contents.itinerary_id
    GROUP BY itineraries.id
    ORDER BY itineraries.id ASC`;


    connection.query(query, (err, result) => {
        if (err) return next(err);
        return res.json({
            total: result.length,
            results: result
        })
    })

}


//----------------SHOW ITINERARY
function showItinerary(req, res, next) {
    const { slug } = req.params;

   
const query = `
        SELECT 
            itineraries.*, 
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', contents.id,
                    'title', contents.title,
                    'slug', contents.slug,
                    'description', contents.description,
                    'category', contents.category,
                    'video_url', contents.video_url,
                    'reading_time', contents.reading_time,
                    'tag', contents.tag,
                    'itinerary_position', itineraries_contents.itinerary_position
                )
            ) AS tappe
        FROM itineraries
        LEFT JOIN itineraries_contents 
            ON itineraries.id = itineraries_contents.itinerary_id
        LEFT JOIN contents 
            ON itineraries_contents.content_id = contents.id
        WHERE itineraries.slug = ?
        GROUP BY itineraries.id`;

    connection.query(query, [slug], (err, results) => {
        if (err) return next(err);
        if (results.length === 0 || results[0].id === null) {
            res.status(404)
            return res.json({ error: "404 NOT FOUND", message: "Itinerario non trovato" });
        }

        console.log(results)
        const itineraryResults = results[0];

          if (typeof itineraryResults.tappe === 'string') {
        itineraryResults.tappe = JSON.parse(itineraryResults.tappe);
    }

        //split sulle foto
        if (itineraryResults.tappe && (itineraryResults.tappe.length === 0 || itineraryResults.tappe[0].id === null)) {
            itineraryResults.tappe = [];
        }

    
      
        return res.json(itineraryResults);
    })

}

//-------------------EXPORT FUNCTIONS ITINERARY
export { indexItinerary, showItinerary }