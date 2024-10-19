import fs from 'fs';
import { promises as fsPromises } from 'fs';
import 'dotenv/config';
import axios from 'axios';
// async file operations
const svgTemplate = await fsPromises.readFile('./badges_a7.svg', 'utf8');
const outputDir = './output/';
// ensure folder exists
if (!fs.existsSync(outputDir)){
  fs.mkdirSync(outputDir);
}
// dummy data
const dummyPic = "../../../../Volumes/u267156.your-storagebox.de/illusUndArbeit/nix/nixcon_2024/avatar.jpg";
const dummyName = "{NAME}";

// ---- functions ----
async function getAllPretixOrdersEntries() {
  const { ORGANIZER: organizer, EVENT: event, TOKEN: token } = process.env;
  const url=`https://pretix.eu/api/v1/organizers/${organizer}/events/${event}/orders/`;
  try {
    let allOrders = [];
    let nextUrl = url;

    // fetch paginated response
    while (nextUrl) {
      console.log('url:', nextUrl);
      const response = await axios.get(nextUrl, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      const data = response.data
      nextUrl = data.next;
      allOrders = allOrders.concat(data.results);
    }
    return allOrders;
  } catch (error) {
    if (error.response) {
      console.error('error:', error.response.status, error.response.data);
    } else {
      console.error('error:', error.message);
    }
  }
};

async function pretixOrdersToNames() {
  try {
    const data = await getAllPretixOrdersEntries();
    const attendeeNames = data.map((x) => {
      let name = null;
      let gitHubName = null;
      let gitHubHandle = null;
      let order = x.positions;


      for (const part of order) {
        if (part.answers) {
          const gitHubAnswer = part.answers?.find(answer => answer.question == 121956);
          if (gitHubAnswer) {
            gitHubName = gitHubAnswer.answer;
            name = gitHubAnswer.answer;
            break;
          }
        }
        if (part.attendee_name) {
          name = part.attendee_name;
        }
      }
      if (!name) {
        name = `order nr. ' + ${order[0].order}`;
      }

        return {
        name,
        gitHubName,
        pictureUrl: dummyPic,
      };
    });
  return attendeeNames;
  } catch (error) {
    console.error('poor error message: ', error.message);
    throw error;
  }
}

async function writeBadges() {
  try {
    let attendeeNames = await pretixOrdersToNames();
    console.log(typeof attendeeNames);
    attendeeNames = await enrichNamesWithAvatarAndHandle(attendeeNames);

    await Promise.all(attendeeNames.map(async (entry) => {
        const { name, gitHubName, gitHubHandle, pictureUrl } = entry;
        // prio: gitHubHandle > gitHubName > name
        const displayName = gitHubHandle || gitHubName || name;
        const output =
          svgTemplate
            .replace(dummyName, displayName)
            .replace(dummyPic, pictureUrl)
            ;

      const fileName = `${name.replace(/\//g, '_')}.svg`;
      const filePath = `${outputDir}${fileName}`;

      await fsPromises.writeFile(filePath, output);
      }));
  } catch (error) {
    console.error('error writing badges:', error.message);
  }
};


async function enrichNamesWithAvatarAndHandle(attendeeNames) {
  const githubToken = process.env.GITHUB_TOKEN;
  //TODO cut url parts from name
  //     fetch for gitHub display names and avatars https://avatars.githubusercontent.com/<username>
  try {
    const enrichedAttendees = await Promise.all(attendeeNames.map(async (attendee) => {
      if (attendee.gitHubName) {
        // TODO: find and delete @ and paths`
        const userUrl = `https://api.github.com/users/${attendee.gitHubName}`;
        try {
          const response = await axios.get(userUrl, {
            headers: {
              'Authorization': `token ${githubToken}`
            }
          });
          const { name, avatar_url } = response.data;
          console.log('name', name, 'git hub name', attendee.gitHubName);
          console.log('avatar_url', avatar_url);
          attendee.pictureUrl = avatar_url;
          if (name) {
            attendee.gitHubHandle = name;
            console.log('gitHubHandle', attendee.gitHubHandle)
          }

        } catch (error) {
          console.error(`error fetching github API for ${attendee.gitHubName}`, error.response?.data || error.message);
          attendee.pictureUrl = dummyPic;
        }
      }
      //console.log(attendee);
      return attendee;
    }));
    //console.log(enrichedAttendees);
    return enrichedAttendees;
  } catch (error) {
    console.error('error enrichNamesWithAvatarAndHandle:', error.message);
  }
};
writeBadges();
