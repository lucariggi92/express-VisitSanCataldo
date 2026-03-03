export default function handleError(err, req, res, next){
    res.status(500);
    return res.json({
        error: process.env.ENVIRONMENT === "development" ? err : "INTERNAL ERROR", 
        message: "Errore interno del server"
    })
}