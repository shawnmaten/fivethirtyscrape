const mongoose = require('mongoose');

const mongoUrl = process.env.MONGO;

mongoose.connect(mongoUrl);
mongoose.connection.on('error', console.error.bind(console, 'Mongo connection error: '));
mongoose.connection.once('open', () => console.log('Mongo connected'));

var articleSchema = new mongoose.Schema({
	sourceUrl: String,
	updatedAt: Date,
	title: String,
	author: String,
	tags: [String],
	text: String,
	imageUrl: String
});

var Article = mongoose.model('Article', articleSchema);

module.exports.Article = Article;