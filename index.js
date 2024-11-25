import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book_notes",
  password: "123456",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const { sort } = req.query;

    
    let query =
      "SELECT *, TO_CHAR(date_read, 'DD/MM/YY') AS formatted_date FROM book_reviews";
    if (sort == "recency") {
      query += " ORDER BY date_read DESC";
    } else if (sort == "rating") {
      query += " ORDER BY rating DESC";
    }

    const result = await db.query(query);

    res.render("index.ejs", {
      books: result.rows,
    });
  } catch (error) {
    console.error("Error finding book reviews: ", error);
    res.status(500).send("Error fetching books reviews.");
  }
});

app.get("/create-review", (req, res) => {
  res.render("create-review.ejs");
});

app.post("/create-review", async (req, res) => {
  const { book_name, isbn, rating, date_read, book_review } = req.body;

  try {
    const result = await db.query(
      "INSERT INTO book_reviews (book_name, isbn, rating, date_read, book_review) VALUES ($1, $2, $3, $4, $5)",
      [book_name, isbn, rating, date_read, book_review]
    );
    res.redirect("/");
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).send("Error creating review");
  }
});

app.get("/edit-review/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    const result = await db.query("SELECT * FROM book_reviews WHERE id = $1", [
      bookId,
    ]);
    const book = result.rows[0];

    if (!book) {
      return res.status(404).send("Book not found.");
    }
    res.render("edit-review.ejs", { book });
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).send("Error fetching book data.");
  }
});

app.post("/edit-review/:id", async (req, res) => {
  const { id, book_name, isbn, rating, date_read, book_review } = req.body;

  try {
    const result = await db.query(
      "UPDATE book_reviews SET book_name = $1, isbn = $2, rating = $3, date_read = $4, book_review = $5 WHERE id = $6",
      [book_name, isbn, rating, date_read, book_review, id]
    );
    res.redirect("/");
  } catch (error) {
    console.error("Error updating book review: ", error);
    res.status(500).send("Error updating review.");
  }
});

app.post("/delete-review/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    const result = await db.query(
      "DELETE FROM book_reviews WHERE id = $1 RETURNING *",
      [bookId]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Book review not found.");
    }

    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred while deleting the book review.");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
