const express = require("express");
const router = express.Router();


router.get("/", async (req, res, next) => {
    return res.status(200).json({
      title: "Check Up",
      message: "The app is working properly!",
    });
  });

router.get("/tunnel", async (req, res, next) => {
  return res.status(200).json({
    title: "/tunnel",
    message: "The route is working properly!",
  });
});

const envelopeParser = express.raw({limit: "100mb", type: () => true});
const SENTRY_HOST = "o4506184016658432.ingest.sentry.io";
const SENTRY_KNOWN_PROJECTS = ["4506308538204160"]

router.post("/tunnel", envelopeParser, async (req, res) => {
  try {
    const envelope = req.body;

    const piece = envelope.slice(0, envelope.indexOf("\n"));
    const header = JSON.parse(piece);

    const dsn = new URL(header.dsn);
    
    if (dsn.hostname !== SENTRY_HOST) {
        return res.status(400).send({ message: `Invalid Sentry host: ${dsn.hostname}` });
    }

    const project_id = dsn.pathname.substring(1);
    if (!SENTRY_KNOWN_PROJECTS.includes(project_id)) {
        return res.status(400).send({ message: `Invalid Project ID: ${project_id}` });
    }

    const url = `https://${SENTRY_HOST}/api/${project_id}/envelope/`;
    await fetch(url, {
        method: "POST",
        body: envelope,
        headers: {
            "Content-Type": "application/x-sentry-envelope"
        }
    });
}
catch {
    return res.sendStatus(204);
}
return res.sendStatus(204);

});

module.exports = router;
