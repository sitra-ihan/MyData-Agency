var fetch = require("node-fetch");
var slug = require("../const");
var iots = require("io-ts-promise");
var ioTypes = require("io-ts");

const PolarUser = ioTypes.type({
  "polar-user-id": ioTypes.Int,
  "member-id": ioTypes.string,
  "first-name": ioTypes.string,
  "last-name": ioTypes.string,
  birthdate: ioTypes.string,
  gender: ioTypes.union([ioTypes.literal("MALE"), ioTypes.literal("FEMALE")]),
  weight: ioTypes.number,
  height: ioTypes.number
});

const PolarTransaction = ioTypes.type({
  "transaction-id": ioTypes.Int
});

const integerIdToStringId = ({ id, ...rest }) => ({ id: id + "", ...rest });

const PolarExercises = ioTypes.type({
  exercises: ioTypes.array(ioTypes.string)
});

const PolarPhysicals = ioTypes.type({
  "physical-informations": ioTypes.array(ioTypes.string)
});

const PolarActivities = ioTypes.type({
  "activity-log": ioTypes.array(ioTypes.string)
});

exports.getUserInformation = async function(url, accessToken, polar_user_id) {
  try {
    let query = url + slug.USER + polar_user_id;
    var headers = {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken
      }
    };
    let response = await fetch(query, headers);
    var data = await response.json();

    const {
      "first-name": first_name,
      "last-name": last_name,
      birthdate: birth_date,
      gender,
      weight,
      height
    } = await iots.decode(PolarUser, data);

    return {
      first_name,
      last_name,
      gender,
      weight_kg: weight,
      height_cm: height,
      birth_date: new Date(birth_date)
    };
  } catch (error) {
    console.log(error);
  }
};

exports.startPolarTransaction = async function(resourceUri, accessToken) {
  try {
    var headers = {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken
      }
    };
    let transaction = await fetch(resourceUri, headers);
    if (transaction.status !== 201) {
      console.log("Resource", resourceUri, "does not have any new data.");
      return null;
    }

    var data = await transaction.json();
    const { "transaction-id": transactionId } = await iots.decode(
      PolarTransaction,
      data
    );

    return transactionId;
  } catch (error) {
    console.log(error);
  }
};

exports.commitPolarTransaction = async function(transcationUri, accessToken) {
  try {
    var headers = {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + accessToken
      }
    };
    return await fetch(transcationUri, headers);
  } catch (error) {
    console.log(error);
  }
};

const getPolarResource = type => accessToken => async resourceUri => {
  try {
    var headers = {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken
      }
    };
    let resource = await fetch(resourceUri, headers);
    var data = await resource.json();
    if (resource.status !== 200 || !data) {
      console.log(
        "Could not get polar resource data with resourceUri" + resourceUri
      );
      return null;
    }
    return await iots.decode(type, data);
  } catch (error) {
    console.log(error);
  }
};

const getPolarResourceWithId = getPolarResource(
  ioTypes.type({
    id: ioTypes.Int
  })
);

const getPolarActivityStepSamplesResource = getPolarResource(ioTypes.unknown);

const getPolarActivityZoneSamplesResource = getPolarResource(ioTypes.unknown);

//Get User Exercises
exports.getUserExercises = async function(url, accessToken, polar_user_id) {
  try {
    let transactionResourceURL =
      url + slug.USER + polar_user_id + slug.EXERCISE_TRANSACTION;
    const transactionId = await exports.startPolarTransaction(
      transactionResourceURL,
      accessToken
    );

    let commitURL = transactionResourceURL + "/" + transactionId;

    var headers = {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken
      }
    };
    let exercises = await fetch(commitURL, headers);
    if (exercises.status !== 200) {
      console.log("Could not fetch exercises for Polar user", polar_user_id);
      return [exercises.status, []];
    }
    var exercises_data = await exercises.json();

    const { exercises: exerciseUris } = await iots.decode(
      PolarExercises,
      exercises_data
    );

    const getUserExerciseSummaryWithToken = getPolarResourceWithId(accessToken);
    const exerciseSummaries = await Promise.all(
      exerciseUris.map(getUserExerciseSummaryWithToken)
    );

    const retVal = exerciseSummaries
      .filter(data => data)
      .map(integerIdToStringId);

    const commitTransaction = await exports.commitPolarTransaction(
      commitURL,
      accessToken
    );

    return [commitTransaction, retVal];
  } catch (error) {
    console.log(error);
  }
};

//Get User activities
exports.getUserActivities = async function(url, accessToken, polar_user_id) {
  try {
    let transactionResourceURL =
      url + slug.USER + polar_user_id + slug.ACTIVITY_TRANSACTION;
    const transactionId = await exports.startPolarTransaction(
      transactionResourceURL,
      accessToken
    );
    let transactionURL = transactionResourceURL + "/" + transactionId;

    var headers = {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken
      }
    };
    let list_activities = await fetch(transactionURL, headers);

    if (list_activities.status !== 200) {
      console.log("Could not fetch activities for Polar user", polar_user_id);
      return [list_activities.status, []];
    }
    var list_activities_log = await list_activities.json();

    const { "activity-log": activityUris } = await iots.decode(
      PolarActivities,
      list_activities_log
    );

    const getUserActivityWithToken = getPolarResourceWithId(accessToken);
    const getUserActivityStepSamplesWithToken = getPolarActivityStepSamplesResource(
      accessToken
    );
    const getUserActivityZoneSamplesWithToken = getPolarActivityZoneSamplesResource(
      accessToken
    );

    const activityDatas = await Promise.all(
      activityUris.map(async activityUri => {
        const [activity, stepSamples, zoneSamples] = await Promise.all([
          getUserActivityWithToken(activityUri),
          getUserActivityStepSamplesWithToken(`${activityUri}/step-samples`),
          getUserActivityZoneSamplesWithToken(`${activityUri}/zone-samples`)
        ]);

        return {
          ...activity,
          stepSamples,
          zoneSamples
        };
      })
    );

    const retVal = activityDatas.filter(data => data).map(integerIdToStringId);

    const commitTransaction = await exports.commitPolarTransaction(
      transactionURL,
      accessToken
    );

    return [commitTransaction, retVal];
  } catch (error) {
    console.log(error);
  }
};

//get User Physicals
exports.getUserPhysicals = async function(url, accessToken, polar_user_id) {
  try {
    let transactionResourceURL =
      url + slug.USER + polar_user_id + slug.PHYSICAL_INFO_TRANSACTION;
    const transactionId = await exports.startPolarTransaction(
      transactionResourceURL,
      accessToken
    );

    let commitURL = transactionResourceURL + "/" + transactionId;

    var headers = {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken
      }
    };
    let physicalInformations = await fetch(commitURL, headers);
    if (physicalInformations.status !== 200) {
      console.log("Could not fetch exercises for Polar user", polar_user_id);
      return [physicalInformations.status, []];
    }
    var physicalInformations_data = await physicalInformations.json();

    const { "physical-informations": physicalUris } = await iots.decode(
      PolarPhysicals,
      physicalInformations_data
    );

    const getUserPhysicalWithToken = getPolarResourceWithId(accessToken);
    const physicalDatas = await Promise.all(
      physicalUris.map(getUserPhysicalWithToken)
    );

    const retVal = physicalDatas.filter(data => data).map(integerIdToStringId);

    const commitTransaction = await exports.commitPolarTransaction(
      commitURL,
      accessToken
    );

    return [commitTransaction, retVal];
  } catch (error) {
    console.log(error);
  }
};
