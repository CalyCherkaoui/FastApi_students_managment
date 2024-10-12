// in .env
VITE_USER_CREDENTIALS_USERNAME='admin'
VITE_USER_CREDENTIALS_PASSWORD='1234'
VITE_BACKEND_API_URL='http://127.0.0.1:8000/api/'
VITE_BACKEND_AUTH_URL='http://127.0.0.1:8000/auth/login/'
VITE_BACKEND_GET_DATA_FROM_MONGODB_URL='http://127.0.0.1:8000/api/GetDataFromMongoDB/'

// in vite.config.js

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default ({ mode }) => {
  // Load environment variables based on the current mode ('development' or 'production')
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [
      react(),
      viteSingleFile(),
      viteStaticCopy({
        targets: [
          {
            src: 'apps-script/*',
            dest: './',
          },
        ],
      }),
    ],
    // Optionally, define global constants
    // define: {
    //   __APP_ENV__: env.APP_ENV,
    // },
  });
};

// in apps-script/Code.js
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi(); // Get the user interface for the active spreadsheet
    ui.createMenu('CaastGPT')
      .addItem('Open', 'openSidebar') // Add menu item that triggers 'openSidebar'
      .addToUi(); // Add the custom menu to the UI
    console.log('Custom menu added successfully.');
  } catch (error) {
    console.error('Failed to add custom menu:', error);
  }
}

function openSidebar() {
  try {
    const ui = SpreadsheetApp.getUi(); // Get the user interface for the active spreadsheet
    const htmlOutput = HtmlService.createHtmlOutputFromFile('ui/index')
                                  .setTitle('CaastGPT Finance Copilot'); // Create HTML output from file
    ui.showSidebar(htmlOutput); // Show the sidebar
    console.log('Sidebar opened successfully.');
  } catch (error) {
    console.error('Failed to open sidebar:', error);
  }
}

// in apps-script/appsscript.json
{
  "timeZone": "Europe/Paris",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}

// in apps-script/api.js

const GetDataFromMongoDB_GAS = (data) => {
  try {
    const url = import.meta.env.VITE_APP_API_URL;
    const response = UrlFetchApp.fetch(`${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application',
        'Authorization': `Bearer ${localStorage.getItem("token")}`,
      },
      payload: JSON.stringify(data),
    });

    const responseData = response;


    return responseData;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}



//in  src/main.jsx

/* imports goes here */

const container = document.getElementById('root')
const root = ReactDOM.createRoot(container)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

//in  app.js

/* imports goes here */

function App() {
  return (
    <Router>
      <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/GetDataFromMongoDB" element={<GetDataFromMongoDB />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App

//in  Home.js

/* imports goes here */

function Home() {
  return (
    <div className="sidebar p-3 bg-slate-50">
      <div className="sidebar-child py-2">
        <LogoPanel />
      </div>
      <div className="sidebar-child" id="features">

          <EltWorkflow />

        <div className="features-child w-full my-3 p-3 rounded-md shadow-sm shadow-slate-400 bg-white" id="templates">
          <div className="feature-header">
            <HeaderFeaturePanel header1="Templates" header2="Choose from a wide range of templates" />
          </div>

        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Home

//in  src/GetDataFromMongoDb.js

/* imports goes here */

function GetDataFromMongoDB() {

  const urlAuth = import.meta.env.VITE_BACKEND_AUTH_URL;
  const urlData = import.meta.env.VITE_BACKEND_GET_DATA_FROM_MONGODB_URL;

  const { fieldItems, resetFieldItems } = useContext(InputChangeContext);

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null); // New state for handling error messages
  const { setToken } = useContext(AuthContext);

  const navigate = useNavigate();

  const [shouldNavigate, setShouldNavigate] = useState(false);

  const handleAuth = async () => {
    const credentials = {
      username: import.meta.env.VITE_USER_CREDENTIALS_USERNAME,
      password: import.meta.env.VITE_USER_CREDENTIALS_PASSWORD,
    };
    try {
      const response = await axios.post(urlAuth, credentials);
      setToken(response.data.access_token);
      localStorage.setItem("token", response.data.access_token);
      console.log("Login successful", response.data);
      console.log("Token", response.data.access_token);
    } catch (error) {
      console.error("Authentication failed:", error);
      setToken(null);
      localStorage.removeItem("token");
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  }

  const handleData = async () => {
    const formData = fieldItems;
    console.log("Form data", formData);

    try {
      console.log("fieldItems context value before submit to backend", fieldItems);
      const response = await axios.post(urlData, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("Form submitted successfully", response.data);
      resetFieldItems();
      setShouldNavigate(true);
    }
    catch (error) {
      console.error("Form submission failed:", error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data); 
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
      throw error; // Rethrow the error to be caught in handleSubmit
    }
  };

  useEffect(() => {
    if (shouldNavigate && Object.keys(fieldItems).length === 0) {
      console.log("Navigating to home page && fieldItems has been reset", fieldItems);
      navigate('/');
    }
  }, [shouldNavigate, fieldItems, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await handleAuth();
      await handleData();
    } catch (error) {
      console.error("Form submission failed:", error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data); 
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <ELTFormComponent
          formELTConfig={ConfigGetDataFromMongoDB}
          onSubmitHandler={handleSubmit}
        />
      )}
    </>
  )
}

export default GetDataFromMongoDB

//in  src/AuthContext.js

/* imports goes here */

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken}}>
      {children}
    </AuthContext.Provider>
  );
};

//in  src/InputChangeContext.js

/* imports goes here */

export const InputChangeContext = createContext({
  fieldItems: {},
  addFieldItem: () => {},
  resetFieldItems: () => {},
});

// the provider that will wrap the components that need access to the value
export function InputChangeProvider({ children }) {

  const [fieldItems, setFieldItems] = useState({});

    // Function to add a new item without mutating state
  const addFieldItem = (inputId, value) => {
      setFieldItems((prevItems) => ({ ...prevItems, [inputId]: value }));
    };
  const resetFieldItems = () => {
    console.log('resetFieldItems called');
    setFieldItems({});
  };


  const value = { fieldItems, addFieldItem, resetFieldItems };

  return (
    <InputChangeContext.Provider value={value}>
      {children}
    </InputChangeContext.Provider>
  );
};

//in  src/ELTFormComponent.js

/* imports goes here */

function ELTFormComponent({formELTConfig, onSubmitHandler}) {
  const backHomeLink = {
    id: 'back-home',
    path: '/',
    label: 'Home',
    imageSrc: `${Icon.homeIcon}`,
    classname: 'home'
  }

  return (
    <div className="sidebar p-3">
      <div className="sidebar-child py-2">
        <LogoPanel />
      </div>

      <div className="sidebar-child px-3" id="features">
        <div className="features-child w-full mb-2" id="workflow">
          <LinkTo path='/' id={backHomeLink.id} label={backHomeLink.label} imageSrc={backHomeLink.imageSrc} classname={backHomeLink.classname} />
          <div className="feature-content w-full">
            <form
              className="w-full rounded my-3"
              id={formELTConfig.formId}
              role='form'
              onSubmit={onSubmitHandler}
              >
                <div
                  className="button flex content-around items-center p-3 w-full font-dm-sans font-bold text-l bg-sky-50"
                >
                  <img src={formELTConfig.title.imageSrc} alt="Icon" className="w-6 h-6" id={formELTConfig.title.imgid}/>
                  <span className="button-label mx-3 text-[#2970FF]">{formELTConfig.title.title}</span>
                </div>
                <div className="fields-group p-3 mb-3">
                  {formELTConfig.fieldsList.map((field) => (
                    <FieldForm
                      key={field.inputId}
                      label={field.label}
                      inputType={field.inputType}
                      inputId={field.inputId}
                      inputPlaceholder={field.inputPlaceholder}
                    />
                  ))}
                </div>
              <ButtonForm
                id={formELTConfig.buttonSubmit.id}
                label={formELTConfig.buttonSubmit.text}
              />
            </form>
          </div>

        </div>
      </div>


      <Footer />
    </div>

  )
}

export default ELTFormComponent


//in  src/FieldForm.js

/* imports goes here */

function FieldForm({ label, inputType, inputId, inputPlaceholder }) {

  const { fieldItems, addFieldItem } = useContext(InputChangeContext);

  const handleInputChange = (e) => {
    const value = e.target.value;
    addFieldItem(inputId, value);
  };
  return (
    <div className="form-group flex flex-col mb-4">
      <label htmlFor={inputId} className="font-roboto text-xs text-[#2970FF] font-medium mb-1">
        {label}
      </label>
      <input
        type={inputType}
        value={fieldItems[inputId] || ''}
        id={inputId}
        placeholder={inputPlaceholder}
        onChange={handleInputChange}
        className="transition ease-in-out delay-150 duration-500 border-b-2 border-sky-100 font-roboto text-xs focus:outline-none focus:border-sky-100 py-2 hover:border-[#2970FF] placeholder:text-slate-400"
      />
    </div>
  );
}

export default FieldForm

//in  src/ButtonForm.js

/* imports goes here */
const ButtonForm = ({ id, label }) => {
  return (
    <button
      type="submit"
      id={id}
      className='bg-blue-500 hover:bg-[#2970FF] text-white font-dm-sans font-medium py-2 px-4 rounded'
    >
      {label && <span className="button-label">{label}</span>}
    </button>
  );
};

export default ButtonForm;

//in  src/ConfigGetDataFromMongoDB.js

const ConfigGetDataFromMongoDB = {
  formId: 'getDataFromMongoDBForm',
  title: {
    title: 'Get data from MongoDB',
    imageSrc: `${Icons.mongodbIcon}`,
    imgid: 'img_getDataFromMongoDBForm',
  },
  buttonSubmit: {
    id: 'button_getDataFromMongoDBForm',
    text: 'Submit',
    imageSrc: `${Icons.mongodbIcon}`,
    classname: 'button-getDataFromMongoDBForm'
  },
  fieldsList: [
    {
      formId: 'Database_form',
      label: 'Database:',
      inputType: 'text',
      inputId: 'Database',
      inputPlaceholder: 'e.g. prod_DB',
    },
    {
      formId: 'Collection_form',
      label: 'Collection:',
      inputType: 'text',
      inputId: 'Collection',
      inputPlaceholder: 'e.g. product_users',
    },
    {
      formId: 'mongodb_pipeline_form',
      label: 'MongoDB pipeline:',
      inputType: 'text',
      inputId: 'mongodb_pipeline',
      inputPlaceholder: 'e.g. [{"$project": {"operations": ["type": "add", "value": 1]}}]}]',
    },
    {
      formId: 'destination_sheet_url_form',
      label: 'Destination sheet URL:',
      inputType: 'text',
      inputId: 'destination_sheet_url',
      inputPlaceholder: 'e.g. https://docs.google.com/spreadsheets',
    },
    {
      formId: 'destination_data_range_start_form',
      label: 'Destination data range start:',
      inputType: 'text',
      inputId: 'destination_data_range_start',
      inputPlaceholder: 'e.g. loader_test!C8',
    },
    {
      formId: 'schedule_cron_expression_form',
      label: 'Schedule cron expression:',
      inputType: 'text',
      inputId: 'schedule_cron_expression',
      inputPlaceholder: 'e.g. 0 0 * * *',
    },
    {
      formId: 'job_start_date_form',
      label: 'Job start date:',
      inputType: 'text',
      inputId: 'job_start_date',
      inputPlaceholder: 'e.g. 2023-01-01',
    }
  ]
}


export default ConfigGetDataFromMongoDB

//in  src/Icons.js

const Icons = {
  mongodbIcon: 'https://img.icons8.com/material-outlined/24/000000/mongodbIcon.png',
  homeIcon: 'https://img.icons8.com/material-outlined/24/000000/home.png',
}

export default Icons

//in  src/LogoPanel.js

/* imports goes here */

function LogoPanel() {
  return (
    <div className="logo-panel">
      <img src={Logo} alt="Logo" className="w-16 h-16" />
    </div>
  )
}

export default LogoPanel

//in  src/Footer.js

/* imports goes here */

function Footer() {
  return (
    <div className="footer text-center py-2 text-xs text-slate-400">
      <p>&copy; 2021 ELT App</p>
    </div>
  )
}

export default Footer

//in  src/HeaderFeaturePanel.js

/* imports goes here */

function HeaderFeaturePanel({ header1, header2 }) {
  return (
    <div className="feature-header-content">
      <h2 className="feature-header-title">{header1}</h2>
      <p className="feature-header-description">{header2}</p>
    </div>
  )
}

export default HeaderFeaturePanel

//in  src/LinkTo.js

/* imports goes here */

function LinkTo({ path, id, label, imageSrc, classname }) {

  return (
    <Link to={path} id={id} className={`link-to ${classname}`}>
      <img src={imageSrc} alt="Icon" className="w-6 h-6" />
      <span className="link-label">{label}</span>
    </Link>
  )
}

export default LinkTo

//in  src/Loader.js

/* imports goes here */

function Loader() {

  return (
    <div className="loader-container">
      <div className="loader"></div>
    </div>
  )
}

export default Loader

//in  src/ELTWorkflow.js

/* imports goes here */

function EltWorkflow() {
  return (
    <div className="features-child w-full my-3 p-3 rounded-md shadow-sm shadow-slate-400 bg-white " id="workflow">
      <HeaderFeaturePanel header1="Elt workflow" header2="Incorporate AI-powered functions into your work." />
      <div className="feature-content w-full">
        {
          FormLinkConfig.map((formLink) => (
            <FormLink
              key={formLink.id}
              id={formLink.id}
              path={formLink.path}
              label={formLink.label}
              imageSrc={formLink.imageSrc}
              classname={formLink.classname}
            />
          ))
        }
        <Separateur text="Elt features are comming soon..." />
      </div>
    </div>
  )
}

export default 

//in  src/FormLink.js

/* imports goes here */

function FormLink({path, id, label, imageSrc, classname}) {
  return (
    <Link
      id={id}
      to={path}
      className={`${classname} button my-1 flex content-around items-center rounded-md p-3 w-full font-dm-sans font-medium text-sm
       hover:text-white hover:bg-[#2970FF] bg-sky-50 text-[#2970FF] hover:shadow-xl transition ease-in-out delay-150 duration-300`}>
        <img src={imageSrc} alt="Icon" className="w-6 h-6" />
        {label && <span className="button-label mx-3">{label}</span>}
    </Link>
  )
}

export default FormLink

//in  src/Separateur.js

/* imports goes here */

function Separateur({ text }) {
  return (
    <div className="separateur">
      <span>{text}</span>
    </div>
  )
}

export default Separateur

//in  src/FormLinkConfig.js
import * as Icon from '../assets/index';

const FormLinkConfig = [
  {
    id: 'UpdateDataInSheet',
    path: '/UpdateDataInSheet',
    label: 'Update Data In Sheet',
    imageSrc: `${Icon.scheduleIcon}`,
    classname: 'UpdateDataInSheet-button',
  },
  {
    id: 'GetDataFromMongoDB',
    path: '/GetDataFromMongoDB',
    label: 'Get Data From MongoDB',
    imageSrc: `${Icon.mongodbIcon}`,
    classname: 'GetDataFromMongoDB-button',
  },
  {
    id: 'ReconciliationData',
    path: '/ReconciliationData',
    label: 'Reconciliation Data',
    imageSrc: `${Icon.reconciliationIcon}`,
    classname: 'ReconciliationData-button',
  }
];

export default FormLinkConfig;

// in src/runGAS.js
export default async function runGas(functionName, args = []) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-undef
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)[functionName](...args);
    } else {
      reject(new Error('Google script API is not available.'));
    }
  });
}





