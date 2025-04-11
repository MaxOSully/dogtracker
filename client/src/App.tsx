import { Switch, Route } from "wouter";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import AddClient from "@/pages/AddClient";
import EditClient from "@/pages/EditClient";
import Appointments from "@/pages/Appointments";
import AddAppointment from "@/pages/AddAppointment";
import EditAppointment from "@/pages/EditAppointment";
import Financials from "@/pages/Financials";
import AddExpenditure from "@/pages/AddExpenditure";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/clients" component={Clients} />
        <Route path="/clients/add" component={AddClient} />
        <Route path="/clients/edit/:id" component={EditClient} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/appointments/add" component={AddAppointment} />
        <Route path="/appointments/edit/:id" component={EditAppointment} />
        <Route path="/financials" component={Financials} />
        <Route path="/financials/add-expenditure" component={AddExpenditure} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default App;
