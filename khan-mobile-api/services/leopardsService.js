const BASE_URL = (process.env.LEOPARDS_API_BASE_URL || 'https://merchantapi.leopardscourier.com/api/').replace(/\/$/, '');

const getCredentials = () => {
  const apiKey = process.env.LEOPARDS_API_KEY;
  const apiPassword = process.env.LEOPARDS_API_PASSWORD;
  if (!apiKey || !apiPassword) {
    const err = new Error('Leopards API is not configured. Set LEOPARDS_API_KEY and LEOPARDS_API_PASSWORD on the server.');
    err.statusCode = 503;
    throw err;
  }
  return { api_key: apiKey, api_password: apiPassword };
};

const parseResponse = async (response, requestUrl, endpoint) => {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const contentType = response.headers.get('content-type') || 'unknown';
    const bodyPreview = text.replace(/\s+/g, ' ').trim().slice(0, 300);
    console.error('Leopards API non-JSON response', {
      endpoint,
      url: requestUrl,
      status: response.status,
      contentType,
      bodyPreview,
    });
    const err = new Error(`Leopards returned a non-JSON response (${response.status}) from ${endpoint}.`);
    err.statusCode = 502;
    err.leopards = { endpoint, status: response.status, contentType, bodyPreview };
    throw err;
  }
  return { data, text };
};

const request = async (endpoint, body) => {
  const requestUrl = `${BASE_URL}${endpoint}/format/json/`;
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...getCredentials(), ...body }),
  });
  const { data } = await parseResponse(response, requestUrl, endpoint);

  if (!response.ok || Number(data?.status) !== 1) {
    const message = typeof data?.error === 'string'
      ? data.error
      : JSON.stringify(data?.error || data || 'Unknown Leopards API error');
    const err = new Error(`Leopards API error: ${message}`);
    err.statusCode = response.status >= 400 ? response.status : 502;
    err.leopards = data;
    throw err;
  }
  return data;
};

const requestCitiesAt = async (requestUrl, label) => {
  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(getCredentials()),
    });
    const { data } = await parseResponse(response, requestUrl, label);
    const success = response.ok && Number(data?.status) === 1 && Array.isArray(data?.city_list);
    console.log('Leopards city endpoint probe', {
      label,
      url: requestUrl,
      status: response.status,
      contentType: response.headers.get('content-type') || 'unknown',
      jsonStatus: data?.status ?? null,
      cityCount: Array.isArray(data?.city_list) ? data.city_list.length : 0,
      success,
    });
    if (success) return data;
    return null;
  } catch (error) {
    console.error('Leopards city endpoint probe failed', {
      label,
      url: requestUrl,
      message: error.message,
      status: error.leopards?.status ?? error.statusCode ?? null,
    });
    return null;
  }
};

const normalizeCity = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

const getCities = async () => {
  try {
    const data = await request('getAllCities', {});
    return Array.isArray(data.city_list) ? data.city_list : [];
  } catch (error) {
    if (error?.leopards?.status !== 404) throw error;

    const baseWithoutApi = BASE_URL.replace(/\/api$/, '');
    const candidates = [
      [`merchantapi-without-api`, `${baseWithoutApi}/getAllCities/format/json/`],
      [`merchantapi-no-trailing-format-slash`, `${BASE_URL}/getAllCities/format/json`],
      [`adminapi-with-api`, `https://adminapi.leopardscourier.com/api/getAllCities/format/json/`],
      [`adminapi-without-api`, `https://adminapi.leopardscourier.com/getAllCities/format/json/`],
    ];

    console.warn('Leopards getAllCities returned 404; probing alternate documented-style URLs.');
    for (const [label, url] of candidates) {
      const data = await requestCitiesAt(url, label);
      if (data) return data.city_list;
    }

    throw error;
  }
};

const resolveDestinationCityId = async (cityName) => {
  if (!cityName) throw Object.assign(new Error('Order city is required for Leopards booking.'), { statusCode: 400 });
  const cities = await getCities();
  const wanted = normalizeCity(cityName);
  const exact = cities.find((city) => normalizeCity(city.name) === wanted && city.allow_as_destination !== false);
  if (exact) return exact.id;
  const partial = cities.find((city) => {
    const name = normalizeCity(city.name);
    return (name.includes(wanted) || wanted.includes(name)) && city.allow_as_destination !== false;
  });
  if (partial) return partial.id;
  throw Object.assign(new Error(`Leopards does not have a matching destination city for "${cityName}". Choose a city supported by Leopards.`), { statusCode: 400 });
};

const bookPacket = async ({ order, weightGrams, pieces = 1, specialInstructions }) => {
  const destinationCity = await resolveDestinationCityId(order.city);
  const originCity = process.env.LEOPARDS_ORIGIN_CITY_ID
    ? Number(process.env.LEOPARDS_ORIGIN_CITY_ID)
    : 'self';
  const weight = Number(weightGrams || process.env.LEOPARDS_DEFAULT_WEIGHT_GRAMS || 500);
  const noPieces = Number(pieces || process.env.LEOPARDS_DEFAULT_PIECES || 1);
  if (!Number.isFinite(weight) || weight <= 0) throw Object.assign(new Error('Shipment weight must be greater than zero.'), { statusCode: 400 });
  if (!Number.isInteger(noPieces) || noPieces <= 0) throw Object.assign(new Error('Shipment pieces must be a positive integer.'), { statusCode: 400 });

  const payload = {
    booked_packet_order_id: order.orderNumber,
    booked_packet_weight: Math.round(weight),
    booked_packet_no_piece: noPieces,
    booked_packet_collect_amount: order.paymentMethod === 'cod' ? Math.round(Number(order.total)) : 0,
    origin_city: originCity,
    destination_city: destinationCity,
    shipment_name_eng: 'self',
    shipment_email: 'self',
    shipment_phone: 'self',
    shipment_address: 'self',
    consignment_name_eng: order.fullName,
    consignment_email: order.email || '',
    consignment_phone: order.phone,
    consignment_phone_two: '',
    consignment_phone_three: '',
    consignment_address: [order.address, order.landmark].filter(Boolean).join(' - '),
    special_instructions: specialInstructions || `Khan Mobile Shop order ${order.orderNumber}`,
    shipment_type: process.env.LEOPARDS_SHIPMENT_TYPE || 'overnight',
    return_city: process.env.LEOPARDS_RETURN_CITY_ID ? Number(process.env.LEOPARDS_RETURN_CITY_ID) : '',
    return_address: process.env.LEOPARDS_RETURN_ADDRESS || '',
    custom_data: [],
  };

  if (process.env.LEOPARDS_SHIPMENT_ID) {
    const shipmentId = Number(process.env.LEOPARDS_SHIPMENT_ID);
    if (!Number.isInteger(shipmentId) || shipmentId <= 0) {
      const err = new Error('LEOPARDS_SHIPMENT_ID must be a positive integer when configured.');
      err.statusCode = 503;
      throw err;
    }
    payload.shipment_id = shipmentId;
  }

  return request('bookPacket', payload);
};

const trackPacket = async (trackNumber) => request('trackBookedPacket', { track_numbers: trackNumber });
const cancelPacket = async (trackNumber) => request('cancelBookedPackets', { cn_numbers: trackNumber });

module.exports = { bookPacket, trackPacket, cancelPacket, getCities };
