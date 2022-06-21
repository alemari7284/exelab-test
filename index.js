require("dotenv").config();
const express = require("express");
const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hi man!");
});

app.post("/create-contact", function (req, res) {
  const body = req.body;
  console.log(body);

  axios
    .post(
      `https://api.hubapi.com/contacts/v1/contact/?hapikey=${process.env.API_KEY}`,
      body,
      {
        Headers: {
          "content-type": "application/json",
        },
      }
    )
    .then((resp) => console.log(resp))
    .catch((err) => console.log(err));
  res.end();
});

app.get("/contact", async (req, res) => {
  const email = req.query.email;
  console.log(email);

  const getEmail = () => {
    return axios
      .get(
        `https://api.hubapi.com/contacts/v1/contact/email/${email}/profile?hapikey=${process.env.API_KEY}`
      )
      .then((response) => response.data)
      .catch((err) => console.log("Not found"));
  };

  const emailData = await getEmail();

  if (emailData) {
    const final = {
      hubspotId: emailData["portal-id"],
      lastName: emailData.properties.lastname.value,
      firstname: emailData.properties.firstname.value,
      email: emailData.properties.email.value,
    };

    console.log(JSON.stringify(final, null, 2));
    res.send(final);
    res.end();
  }
  res.status(404).send({
    error: "Not found",
  });
  res.end();
});

app.get("/contacts/csv", async (req, res) => {
  const getAllContacts = () => {
    return axios
      .get(
        `https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey=${process.env.API_KEY}`
      )
      .then((response) => response.data)
      .catch((err) => console.error(err));
  };

  const contactsData = await getAllContacts();
  const newArray = contactsData.contacts.map((person, id) => {
    return {
      firstname: person.properties.firstname.value,
      lastname: person.properties.lastname.value,
      email: person["identity-profiles"][0].identities[0].value,
    };
  });
  const csv = new ObjectsToCsv(newArray);
  await csv.toDisk("./list.csv");

  console.log(JSON.stringify(contactsData, null, 2));
  res.send(contactsData);
  res.end;
});
// https://api.hubapi.com/contacts/v1/search/query?q=testingapis&hapikey=demo

app.get("/search-contacts", async (req, res) => {
  const firstname = req.query.firstname;
  console.log(firstname);
  const getByFirstName = () => {
    return axios
      .get(
        `https://api.hubapi.com/contacts/v1/search/query?q=${firstname}&hapikey=${process.env.API_KEY}`
      )
      .then((response) => response.data)
      .catch((err) => console.error(err));
  };

  const contactsData = await getByFirstName();
  const final = contactsData.contacts.map((person) => {
    return {
      hubspotId: person["portal-id"],
      lastName: person.properties?.lastname.value,
      firstname: person.properties?.firstname.value,
      email: person.properties?.email.value,
    };
  });

  console.log(final);
  res.send(final);
  res.end;
});

app.get("/oauth", async (req, res) => {
  res.write("Hi, you are authenticated");

  const formData = {
    grant_type: "authorization_code",
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.REDIRECT_URI,
    code: req.query.code,
  };

  console.log(formData);
  const options = {
    method: 'POST',
    headers: { 'content-type': 'x-www-form-urlencoded' },
    data: formData,
    url: "https://api.hubapi.com/oauth/v1/token",
  };

  const getToken = () => {
    return axios(options)
    .then(resp => resp)
    .catch(err => err)
  };

  const myToken = await getToken();
  console.log(myToken);
  res.send();
});

app.listen(3000, () => {
  console.log("hello world!");
});
