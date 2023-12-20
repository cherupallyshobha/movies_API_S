const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertMoviesObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

//get Method
app.get("/movies/", async (request, response) => {
  const getMoviesArray = `
    SELECT 
    movie_name
    FROM 
    movie;`;
  const moviesArray = await db.all(getMoviesArray);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//Get only One movie Data
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = ` 
  SELECT 
  * 
  FROM 
  movie
  WHERE 
  movie_id = ${movieId};`;
  const movieArray = await db.get(getMovieQuery);

  response.send(convertMoviesObjectToResponseObject(movieArray));
});
// POST Method
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
  INSERT INTO 
  movie(director_id, movie_name, lead_actor)

  VALUES(
      ${directorId}, 
      '${movieName}', 
      '${leadActor}'
  );`;

  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//PUT Method
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
   UPDATE 
   movie 
   SET 
   director_id = ${directorId},
   movie_name = '${movieName}',
   lead_actor = '${leadActor}'
   WHERE 
    director_id = ${directorId};`;
  const dbResponse = await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//DELETE Method
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM 
    movie 
    WHERE 
    movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

const convertDirectorObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//GET Method
app.get("/directors/", async (request, response) => {
  const getAllDirectorsQuery = `
     SELECT 
      * 
    FROM 
    director;`;
  const directorArray = await db.all(getAllDirectorsQuery);
  response.send(
    directorArray.map((director) =>
      convertDirectorObjectToResponseObject(director)
    )
  );
});

const convertMovieObjectToResponseObject = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

//GET Only One Director Details
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMovieQuery = `
     SELECT 
     movie_name 
     director INNER JOIN movie
     ON director.director_id = movie.director_id
     WHERE 
     director.director_id = ${directorId};`;
  const movies = await db.all(getDirectorMovieQuery);
  console.log(directorId);
  response.send(
    movies.map((movieNames) => convertMovieObjectToResponseObject(movieNames))
  );
});
module.exports = app;
