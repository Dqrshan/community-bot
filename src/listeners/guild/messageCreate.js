const { Listener } = require('@sapphire/framework');

class UserEvent extends Listener {
	constructor(context, options = {}) {
		super(context, {
			...options
		});
	}

	run(msg) {
		try {
			this.container.client.dokdo.run(msg);
		} catch (e) {
			this.container.client.logger.fatal(e);
		}
	}
}

module.exports = {
	UserEvent
};
