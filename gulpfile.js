const { src, dest } = require('gulp');

function copyIcons() {
	// Only copy to one location to prevent duplicate nodes
	return src('nodes/**/*.svg')
		.pipe(dest('dist/nodes'));  // Only copy to dist/nodes
}

exports['copy:icons'] = copyIcons;
