import connection from "../db/dbConnection.js"


function indexItinerary(req, res, next) {
         const query = `     SELECT * 
   FROM db_visit_project.itineraries
    INNER JOIN contents
    ON itineraries.content_id = contents.id
    WHERE contents.is_visible=1
    ORDER BY itineraries.id ASC`;

     connection.query(query, (err, result) => {
         if (err) return next(err);
         return res.json({
             total: result.length,
             results: result
         })
     })

 }


 
 function showItinerary(req, res, next){
      const id = req.params.id;
    const query =  `SELECT * 
     FROM db_visit_project.itineraries
     INNER JOIN contents
     ON itineraries.content_id = contents.id
     WHERE itineraries.id = ? AND contents.is_visible=1`;

       connection.query(query, [id], (err, result) => {
         if (err) return next(err);
         if (result.length === 0) {
             return res.status(404).json({ error: 'Itinerario non trovato' });
         }
         return res.json(result[0]);
     })

 }


 export{indexItinerary, showItinerary}